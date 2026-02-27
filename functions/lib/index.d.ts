import * as functions from "firebase-functions";
import * as functionsV1Firestore from "firebase-functions/v1/firestore";
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
export declare const createFeedback: functions.https.CallableFunction<CreateFeedbackRequest & HoneypotData, Promise<{
    success: boolean;
    id: null;
    issueNumber?: undefined;
} | {
    success: boolean;
    id: string;
    issueNumber: number | null;
}>, unknown>;
export declare const generateDraft: functions.https.CallableFunction<{
    text: string;
} & HoneypotData, Promise<{
    type: "feature" | "bug";
    title: string;
    summary: string;
    details: {};
    followUpQuestion: string;
    isFallback: boolean;
} | {
    error: string;
    type?: undefined;
    title?: undefined;
    summary?: undefined;
    details?: undefined;
    followUpQuestion?: undefined;
    isFallback?: undefined;
} | {
    type: "feature" | "bug";
    title: string;
    summary: string;
    details: Record<string, string>;
    followUpQuestion: string | undefined;
    isFallback: boolean;
    error?: undefined;
}>, unknown>;
export declare const addVote: functions.https.CallableFunction<{
    feedbackId: string;
    userId: string;
}, Promise<{
    success: boolean;
    alreadyVoted: boolean;
}>, unknown>;
export declare const syncGitHubStatus: functions.https.CallableFunction<{
    feedbackId: string;
}, Promise<{
    success: boolean;
    message: string;
    status?: undefined;
} | {
    success: boolean;
    status: any;
    message?: undefined;
}>, unknown>;
export declare const updatePreviewUrl: functions.https.HttpsFunction;
export declare const onGitHubWebhook: functions.https.HttpsFunction;
/**
 * When a comment is created, increment commentCount on the corresponding
 * feedback document. Client cannot update feedback docs (Firestore rules).
 */
export declare const onCommentCreated: import("firebase-functions/lib/v1/cloud-functions").CloudFunction<functionsV1Firestore.QueryDocumentSnapshot>;
export {};
//# sourceMappingURL=index.d.ts.map