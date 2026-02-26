import { z } from "zod";

import type {
  ApiError,
  CreatePostInput,
  PaginationParams,
  Post,
  UpdatePostInput,
} from "@/types/api";

/**
 * Base API URL - using JSONPlaceholder for demo purposes.
 * Can be overridden with VITE_API_BASE_URL.
 */
const DEFAULT_BASE_URL = "https://jsonplaceholder.typicode.com";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
const DEFAULT_TIMEOUT_MS = 10000;

type ApiErrorCode =
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "ABORT_ERROR"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR";

type FetchApiOptions = RequestInit & {
  timeoutMs?: number;
};

const postSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

const postsSchema = z.array(postSchema);

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  status: number;
  code: ApiErrorCode;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
    code: ApiErrorCode = "HTTP_ERROR"
  ) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const isJsonContentType = (contentType: string | null): boolean => {
  if (!contentType) {
    return false;
  }

  return (
    contentType.includes("application/json") || contentType.includes("+json")
  );
};

const isRecordOfStringArrays = (
  value: unknown
): value is Record<string, string[]> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) =>
      Array.isArray(entry) &&
      entry.every((item) => typeof item === "string")
  );
};

const normalizeValidationErrors = (
  issues: z.ZodIssue[]
): Record<string, string[]> => {
  return issues.reduce<Record<string, string[]>>((acc, issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";

    if (!acc[path]) {
      acc[path] = [];
    }

    acc[path].push(issue.message);
    return acc;
  }, {});
};

const validateApiData = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  resourceName: string
): T => {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new ApiException(
      `Invalid ${resourceName} response from API`,
      502,
      normalizeValidationErrors(parsed.error.issues),
      "VALIDATION_ERROR"
    );
  }

  return parsed.data;
};

const createRequest = (
  endpoint: string,
  options: Omit<FetchApiOptions, "timeoutMs" | "signal">,
  signal: AbortSignal
): { url: string; init: RequestInit } => {
  return {
    url: `${BASE_URL}${endpoint}`,
    init: {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal,
    },
  };
};

const parseJsonFromText = (text: string, status: number): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiException(
      "Failed to parse JSON response from API",
      status,
      undefined,
      "PARSE_ERROR"
    );
  }
};

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const rawText = await response.text();
  const trimmedText = rawText.trim();

  if (trimmedText.length === 0) {
    return undefined;
  }

  if (!isJsonContentType(response.headers.get("content-type"))) {
    return trimmedText;
  }

  return parseJsonFromText(trimmedText, response.status);
};

const normalizeErrorPayload = (
  payload: unknown,
  status: number,
  fallbackMessage: string
): ApiError => {
  if (!payload || typeof payload !== "object") {
    return { message: fallbackMessage, status };
  }

  const candidate = payload as Partial<ApiError>;

  return {
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : fallbackMessage,
    status: typeof candidate.status === "number" ? candidate.status : status,
    errors: isRecordOfStringArrays(candidate.errors)
      ? candidate.errors
      : undefined,
  };
};

const normalizeErrorResponse = async (response: Response): Promise<ApiError> => {
  const fallbackMessage = response.statusText || "An error occurred";
  const parsedBody = await parseResponse(response).catch(() => undefined);

  if (typeof parsedBody === "string") {
    return {
      message: parsedBody || fallbackMessage,
      status: response.status,
    };
  }

  return normalizeErrorPayload(parsedBody, response.status, fallbackMessage);
};

const createAbortController = (
  timeoutMs: number,
  signal?: AbortSignal | null
): {
  controller: AbortController;
  didTimeout: () => boolean;
  cleanup: () => void;
} => {
  const controller = new AbortController();
  let timedOut = false;

  const handleAbort = () => {
    controller.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", handleAbort, { once: true });
    }
  }

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort("request-timeout");
  }, timeoutMs);

  const cleanup = () => {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", handleAbort);
  };

  return {
    controller,
    didTimeout: () => timedOut,
    cleanup,
  };
};

/**
 * Type-safe fetch wrapper with error handling
 */
const fetchApi = async <T>(
  endpoint: string,
  options?: FetchApiOptions
): Promise<T> => {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    ...requestOptions
  } = options ?? {};
  const { controller, didTimeout, cleanup } = createAbortController(
    timeoutMs,
    signal
  );

  try {
    const request = createRequest(endpoint, requestOptions, controller.signal);
    const response = await fetch(request.url, request.init);

    if (!response.ok) {
      const normalizedError = await normalizeErrorResponse(response);

      throw new ApiException(
        normalizedError.message || "An error occurred",
        response.status,
        normalizedError.errors,
        "HTTP_ERROR"
      );
    }

    return (await parseResponse(response)) as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      if (didTimeout()) {
        throw new ApiException(
          "Request timed out",
          408,
          undefined,
          "TIMEOUT_ERROR"
        );
      }

      throw new ApiException("Request was aborted", 499, undefined, "ABORT_ERROR");
    }

    throw new ApiException(
      error instanceof Error ? error.message : "Network error occurred",
      0,
      undefined,
      "NETWORK_ERROR"
    );
  } finally {
    cleanup();
  }
};

/**
 * API Client - Posts endpoints
 */
export const postsApi = {
  /**
   * Get all posts with optional pagination
   */
  getPosts: async (params?: PaginationParams): Promise<Post[]> => {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("_page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("_limit", params.limit.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/posts${query ? `?${query}` : ""}`;

    const posts = await fetchApi<unknown>(endpoint);
    return validateApiData(postsSchema, posts, "posts list");
  },

  /**
   * Get a single post by ID
   */
  getPost: async (id: number): Promise<Post> => {
    const post = await fetchApi<unknown>(`/posts/${id}`);
    return validateApiData(postSchema, post, "post");
  },

  /**
   * Create a new post
   */
  createPost: async (data: CreatePostInput): Promise<Post> => {
    const post = await fetchApi<unknown>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return validateApiData(postSchema, post, "post");
  },

  /**
   * Update an existing post
   */
  updatePost: async (id: number, data: UpdatePostInput): Promise<Post> => {
    const post = await fetchApi<unknown>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return validateApiData(postSchema, post, "post");
  },

  /**
   * Delete a post
   */
  deletePost: async (id: number): Promise<void> => {
    await fetchApi<void>(`/posts/${id}`, {
      method: "DELETE",
    });
  },
};
