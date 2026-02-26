import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Octokit } from "octokit";
import OpenAI from "openai";

admin.initializeApp();

const db = admin.firestore();
const githubToken = process.env.GITHUB_TOKEN;
const githubRepoOwner = process.env.GITHUB_REPO_OWNER;
const githubRepoName = process.env.GITHUB_REPO_NAME;
const openaiApiKey = process.env.OPENAI_API_KEY;

const octokit = new Octokit({
  auth: githubToken,
});

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

interface CreateFeedbackRequest {
  title: string;
  summary: string;
  type: "feature" | "bug";
  details?: {
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
  };
}

interface HoneypotData {
  honeypot?: string;
}

const validateHoneypot = (data: HoneypotData): boolean => {
  return !data.honeypot || data.honeypot.trim() === "";
};

const checkRateLimit = async (
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> => {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  const rateLimitRef = db.collection("ratelimits").doc(key);
  const doc = await rateLimitRef.get();

  let count = 0;
  let windowStartTime = now;

  if (doc.exists) {
    const data = doc.data();
    count = data.count || 0;
    windowStartTime = data.windowStart || now;

    if (now - windowStartTime > windowSeconds) {
      count = 0;
      windowStartTime = now;
    }
  }

  if (count >= limit) {
    return false;
  }

  await rateLimitRef.set(
    {
      count: increment(1),
      windowStart: windowStartTime,
      lastUpdated: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  );

  return true;
};

const createGitHubIssue = async (
  title: string,
  summary: string,
  type: "feature" | "bug",
  details?: CreateFeedbackRequest["details"]
): Promise<number | null> => {
  if (!githubToken || !githubRepoOwner || !githubRepoName) {
    console.warn(
      "GitHub credentials not configured. Skipping issue creation."
    );
    return null;
  }

  const body = formatIssueBody(summary, type, details);
  const labels = ["cf:public", `cf:type/${type}`, "cf:status/new"];

  try {
    const response = await octokit.rest.issues.create({
      owner: githubRepoOwner,
      repo: githubRepoName,
      title,
      body,
      labels,
    });

    return response.data.number;
  } catch (error) {
    console.error("Failed to create GitHub issue:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create GitHub issue"
    );
  }
};

const formatIssueBody = (
  summary: string,
  type: "feature" | "bug",
  details?: CreateFeedbackRequest["details"]
): string => {
  let body = summary;

  if (type === "bug" && details) {
    body += "\n\n## Details\n";
    if (details.stepsToReproduce) {
      body += `\n### Steps to Reproduce\n${details.stepsToReproduce}`;
    }
    if (details.expectedBehavior) {
      body += `\n\n### Expected Behavior\n${details.expectedBehavior}`;
    }
    if (details.actualBehavior) {
      body += `\n\n### Actual Behavior\n${details.actualBehavior}`;
    }
  }

  body += "\n\n_Submitted via Customer Feedback Previewer_";

  return body;
};

export const createFeedback = functions.https.onCall(
  async (data: CreateFeedbackRequest & HoneypotData, context) => {
    if (!validateHoneypot(data)) {
      console.warn("Honeypot triggered");
      return { success: false, id: null };
    }

    const { title, summary, type, details } = data;

    if (!title || !summary || !type) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: title, summary, type"
      );
    }

    if (title.length > 200 || summary.length > 5000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Submission too long"
      );
    }

    const clientIp = context.rawRequest.headers["x-forwarded-for"] || "unknown";
    const isRateLimited = !(await checkRateLimit(`submissions-${clientIp}`, 10, 86400));

    if (isRateLimited) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many submissions. Please try again later."
      );
    }

    const issueNumber = await createGitHubIssue(title, summary, type, details);

    const feedbackDoc = {
      title,
      summary,
      type,
      details: details || {},
      status: "new",
      votes: 0,
      commentCount: 0,
      githubIssueNumber: issueNumber,
      githubIssueUrl: issueNumber
        ? `https://github.com/${githubRepoOwner}/${githubRepoName}/issues/${issueNumber}`
        : null,
      previewUrl: null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection("feedback").add(feedbackDoc);

    return {
      success: true,
      id: docRef.id,
      issueNumber,
    };
  }
);

export const generateDraft = functions.https.onCall(
  async (data: { text: string } & HoneypotData, context) => {
    if (!validateHoneypot(data)) {
      console.warn("Honeypot triggered on draft generation");
      return { error: "Invalid submission" };
    }

    const { text } = data;

    if (!text || text.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Empty input");
    }

    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, using fallback");
      return getFallbackDraft(text);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that structures user feedback into clear bug reports or feature requests.
Given user input, extract:
1. Type: "bug" or "feature" (infer from context)
2. Title: A concise title (max 100 chars)
3. Summary: A clear description (max 500 chars)
4. For bugs: Steps to reproduce, expected behavior, actual behavior (if mentioned)
5. A single follow-up question if critical info is missing (optional)

Respond in JSON format:
{
  "type": "bug" | "feature",
  "title": "...",
  "summary": "...",
  "details": {
    "stepsToReproduce": "...",
    "expectedBehavior": "...",
    "actualBehavior": "..."
  },
  "followUpQuestion": "..." or null
}`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return getFallbackDraft(text);
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return getFallbackDraft(text);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        type: parsed.type || "feature",
        title: parsed.title || text.split("\n")[0].substring(0, 100),
        summary: parsed.summary || text.substring(0, 500),
        details: parsed.details || {},
        followUpQuestion: parsed.followUpQuestion || undefined,
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return getFallbackDraft(text);
    }
  }
);

const getFallbackDraft = (text: string) => {
  const inferredType = text.toLowerCase().includes("bug") ? "bug" : "feature";
  const title = text.split("\n")[0].substring(0, 100);
  const summary = text.substring(0, 500);

  return {
    type: inferredType,
    title,
    summary,
    details: {},
    followUpQuestion: undefined,
  };
};

export const syncGitHubStatus = functions.https.onCall(
  async (data: { feedbackId: string }, context) => {
    const { feedbackId } = data;

    const feedbackDoc = await db.collection("feedback").doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Feedback not found");
    }

    const feedback = feedbackDoc.data();
    const issueNumber = feedback?.githubIssueNumber;

    if (!issueNumber) {
      return { success: false, message: "No GitHub issue linked" };
    }

    if (!githubToken || !githubRepoOwner || !githubRepoName) {
      return { success: false, message: "GitHub credentials not configured" };
    }

    try {
      const issue = await octokit.rest.issues.get({
        owner: githubRepoOwner,
        repo: githubRepoName,
        issue_number: issueNumber,
      });

      const labels = issue.data.labels.map((label) =>
        typeof label === "string" ? label : label.name
      );
      const statusLabel = labels.find((label) => label.startsWith("cf:status/"));
      const status = statusLabel
        ? statusLabel.replace("cf:status/", "")
        : "new";

      await db.collection("feedback").doc(feedbackId).update({
        status,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      return { success: true, status };
    } catch (error) {
      console.error("Failed to sync GitHub status:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to sync GitHub status"
      );
    }
  }
);

interface PreviewWebhookRequest {
  prNumber: number;
  previewUrl: string;
}

export const updatePreviewUrl = functions.https.onRequest(
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.sendStatus(204);
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const authHeader = req.headers.authorization;
    const webhookSecret = process.env.PREVIEW_WEBHOOK_SECRET;

    if (!webhookSecret || !authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      res.status(401).send("Unauthorized");
      return;
    }

    const { prNumber, previewUrl } = req.body as PreviewWebhookRequest;

    if (!prNumber || !previewUrl) {
      res.status(400).send("Missing required fields");
      return;
    }

    if (!githubToken || !githubRepoOwner || !githubRepoName) {
      res.status(500).send("GitHub credentials not configured");
      return;
    }

    try {
      const feedbackSnapshot = await db
        .collection("feedback")
        .where("githubIssueNumber", "==", prNumber)
        .limit(1)
        .get();

      if (feedbackSnapshot.empty) {
        res.status(404).send("Feedback not found for this PR");
        return;
      }

      const feedbackDoc = feedbackSnapshot.docs[0];

      await feedbackDoc.ref.update({
        previewUrl,
        status: "preview",
        updatedAt: admin.firestore.Timestamp.now(),
      });

      if (githubToken && githubRepoOwner && githubRepoName) {
        try {
          await octokit.rest.issues.update({
            owner: githubRepoOwner,
            repo: githubRepoName,
            issue_number: prNumber,
            labels: [
              "cf:public",
              `cf:type/${feedbackDoc.data().type}`,
              "cf:status/preview",
            ],
          });
        } catch (error) {
          console.warn("Failed to update GitHub labels:", error);
        }
      }

      res.json({ success: true, message: "Preview URL updated" });
    } catch (error) {
      console.error("Failed to update preview URL:", error);
      res.status(500).send("Failed to update preview URL");
    }
  }
);
