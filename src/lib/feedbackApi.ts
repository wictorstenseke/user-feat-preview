import {
  collection,
  doc,
  DocumentSnapshot,
  getDocs,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  Query,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "./firebase";

import type {
  Comment,
  CreateFeedbackInput,
  DraftFeedback,
  FeedbackItem,
} from "@/types/api";

const BUG_KEYWORDS = ["bug", "broken", "crash", "error", "fail", "wrong", "not working", "doesn't work", "doesnt work"];

export const createLocalDraft = (text: string): DraftFeedback => {
  const lowerText = text.toLowerCase();
  const type = BUG_KEYWORDS.some((kw) => lowerText.includes(kw)) ? "bug" : "feature";
  return {
    type,
    title: "User Feedback",
    summary: text.substring(0, 500),
    details: {},
    isFallback: true,
  };
};

const createFeedbackCallable = httpsCallable<
  CreateFeedbackInput & { honeypot?: string },
  { success: boolean; id: string; issueNumber?: number }
>(functions, "createFeedback");

const generateDraftCallable = httpsCallable<
  { text: string; honeypot?: string },
  DraftFeedback
>(functions, "generateDraft");

const syncGitHubStatusCallable = httpsCallable<
  { feedbackId: string },
  { success: boolean; status?: string }
>(functions, "syncGitHubStatus");

const addVoteCallable = httpsCallable<
  { feedbackId: string; userId: string },
  { success: boolean; alreadyVoted: boolean }
>(functions, "addVote");

const mapFirestoreDocToFeedback = (
  doc: DocumentSnapshot
): FeedbackItem | null => {
  if (!doc.exists()) return null;

  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    summary: data.summary,
    type: data.type,
    status: data.status || "new",
    details: data.details,
    votes: data.votes || 0,
    commentCount: data.commentCount || 0,
    lastUpdated: data.updatedAt?.toDate?.().toLocaleString() || "",
    previewUrl: data.previewUrl,
    githubIssueNumber: data.githubIssueNumber,
    githubIssueUrl: data.githubIssueUrl,
    createdAt: data.createdAt?.toDate?.().toISOString() || "",
  };
};

export const feedbackApi = {
  subscribeToActiveFeedback(
    onUpdate: (items: FeedbackItem[]) => void
  ): () => void {
    const activeStatuses = ["new", "planned", "in-progress", "preview"];
    const q = query(
      collection(db, "feedback"),
      where("status", "in", activeStatuses),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(mapFirestoreDocToFeedback)
        .filter(Boolean) as FeedbackItem[];
      onUpdate(items);
    });
  },

  subscribeToMergedFeedback(
    onUpdate: (items: FeedbackItem[]) => void
  ): () => void {
    const q = query(
      collection(db, "feedback"),
      where("status", "in", ["merged"]),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(mapFirestoreDocToFeedback)
        .filter(Boolean) as FeedbackItem[];
      onUpdate(items);
    });
  },

  async getFeedbackItems(
    includeStatuses?: string[]
  ): Promise<FeedbackItem[]> {
    const feedbackCollection = collection(db, "feedback");
    let q: Query;

    if (includeStatuses && includeStatuses.length > 0) {
      q = query(
        feedbackCollection,
        where("status", "in", includeStatuses),
        orderBy("updatedAt", "desc")
      );
    } else {
      q = query(feedbackCollection, orderBy("updatedAt", "desc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapFirestoreDocToFeedback).filter(Boolean) as FeedbackItem[];
  },

  async getActiveFeedback(): Promise<FeedbackItem[]> {
    const activeStatuses = ["new", "planned", "in-progress", "preview"];
    return this.getFeedbackItems(activeStatuses);
  },

  async getMergedFeedback(): Promise<FeedbackItem[]> {
    return this.getFeedbackItems(["merged"]);
  },

  async getFeedbackById(id: string): Promise<FeedbackItem | null> {
    const docRef = doc(db, "feedback", id);
    const snapshot = await getDoc(docRef);
    return mapFirestoreDocToFeedback(snapshot);
  },

  async createFeedback(
    input: CreateFeedbackInput,
    honeypot?: string
  ): Promise<{ id: string; issueNumber?: number }> {
    const result = await createFeedbackCallable({
      ...input,
      honeypot,
    });

    if (!result.data.success) {
      throw new Error("Failed to create feedback");
    }

    return {
      id: result.data.id,
      issueNumber: result.data.issueNumber,
    };
  },

  async generateDraft(text: string, honeypot?: string): Promise<DraftFeedback> {
    const result = await generateDraftCallable({
      text,
      honeypot,
    });

    if ("error" in result.data) {
      throw new Error(result.data.error as string);
    }

    return result.data;
  },

  async syncStatus(feedbackId: string): Promise<string | null> {
    const result = await syncGitHubStatusCallable({ feedbackId });

    if (!result.data.success) {
      return null;
    }

    return result.data.status || null;
  },

  async addVote(feedbackId: string, userId: string): Promise<boolean> {
    try {
      const result = await addVoteCallable({ feedbackId, userId });
      return result.data.success && !result.data.alreadyVoted;
    } catch (error) {
      console.error("Failed to add vote:", error);
      throw error;
    }
  },

  async hasUserVoted(feedbackId: string, userId: string): Promise<boolean> {
    const voteRef = doc(db, "votes", `${feedbackId}-${userId}`);
    const snapshot = await getDoc(voteRef);
    return snapshot.exists();
  },

  async addComment(
    feedbackId: string,
    text: string,
    userIdentifier: string
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    if (text.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    const commentsCollection = collection(db, "comments");
    const commentRef = doc(commentsCollection);
    await setDoc(commentRef, {
      itemId: feedbackId,
      text,
      userIdentifier,
      createdAt: new Date(),
    });

    const feedbackRef = doc(db, "feedback", feedbackId);
    await updateDoc(feedbackRef, {
      commentCount: increment(1),
    });

    return commentRef.id;
  },

  async getComments(feedbackId: string): Promise<Comment[]> {
    const commentsCollection = collection(db, "comments");
    const q = query(
      commentsCollection,
      where("itemId", "==", feedbackId),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      itemId: doc.data().itemId,
      text: doc.data().text,
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || "",
      userIdentifier: doc.data().userIdentifier,
    }));
  },

  async searchDuplicates(
    title: string,
    limit_: number = 5
  ): Promise<FeedbackItem[]> {
    const feedbackCollection = collection(db, "feedback");
    const titleWords = title.toLowerCase().split(/\s+/).filter(Boolean);

    const results: FeedbackItem[] = [];
    const q = query(feedbackCollection, orderBy("updatedAt", "desc"));

    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const feedback = mapFirestoreDocToFeedback(doc);
      if (!feedback) return;

      const docTitle = feedback.title.toLowerCase();
      const docSummary = feedback.summary.toLowerCase();

      const titleMatch = titleWords.filter(
        (word) => docTitle.includes(word) || docSummary.includes(word)
      ).length;

      if (titleMatch >= Math.ceil(titleWords.length * 0.5)) {
        results.push(feedback);
      }
    });

    return results.slice(0, limit_);
  },
};
