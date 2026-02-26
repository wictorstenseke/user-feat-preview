import * as functions from "firebase-functions";
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
    error: string;
    type?: undefined;
    title?: undefined;
    summary?: undefined;
    details?: undefined;
    followUpQuestion?: undefined;
} | {
    type: any;
    title: any;
    summary: any;
    details: any;
    followUpQuestion: any;
    error?: undefined;
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
export {};
//# sourceMappingURL=index.d.ts.map