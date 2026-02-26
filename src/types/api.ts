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
