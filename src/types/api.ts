/**
 * Common API types and interfaces
 */

// Base response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
}

// Error response
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Post entity (using JSONPlaceholder API schema)
export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// Create post input
export interface CreatePostInput {
  title: string;
  body: string;
  userId: number;
}

// Update post input
export interface UpdatePostInput {
  title?: string;
  body?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Feedback types
export type FeedbackType = "feature" | "bug";
export type FeedbackStatus =
  | "new"
  | "planned"
  | "in-progress"
  | "preview"
  | "merged"
  | "closed"
  | "wontfix"
  | "duplicate";

export interface FeedbackDetails {
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  summary: string;
  type: FeedbackType;
  status: FeedbackStatus;
  details?: FeedbackDetails;
  votes: number;
  commentCount: number;
  lastUpdated: string;
  previewUrl?: string;
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  createdAt: string;
  userVoted?: boolean;
}

export interface CreateFeedbackInput {
  title: string;
  summary: string;
  type: FeedbackType;
  details?: FeedbackDetails;
}

export interface DraftFeedback {
  type: FeedbackType;
  title: string;
  summary: string;
  details?: FeedbackDetails;
  followUpQuestion?: string;
  isFallback?: boolean;
}

export interface Vote {
  itemId: string;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  itemId: string;
  text: string;
  createdAt: string;
  userIdentifier: string;
}
