import { type ReactNode } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { QueryClientProvider } from "@tanstack/react-query";

import { postsApi } from "@/lib/api";
import { createTestQueryClient } from "@/test/utils";

import {
  usePostsQuery,
  usePostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  postKeys,
} from "./usePosts";

import type { Post } from "@/types/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  postsApi: {
    getPosts: vi.fn(),
    getPost: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
  },
}));

describe("usePosts hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  describe("usePostsQuery", () => {
    it("fetches posts successfully", async () => {
      const mockPosts = [
        { id: 1, title: "Post 1", body: "Body 1", userId: 1 },
        { id: 2, title: "Post 2", body: "Body 2", userId: 1 },
      ];
      vi.mocked(postsApi.getPosts).mockResolvedValue(mockPosts);

      const { result } = renderHook(() => usePostsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPosts);
      expect(postsApi.getPosts).toHaveBeenCalledWith(undefined);
    });

    it("fetches posts with pagination parameters", async () => {
      const mockPosts = [{ id: 1, title: "Post 1", body: "Body 1", userId: 1 }];
      vi.mocked(postsApi.getPosts).mockResolvedValue(mockPosts);

      const params = { page: 2, limit: 10 };
      const { result } = renderHook(() => usePostsQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(postsApi.getPosts).toHaveBeenCalledWith(params);
    });
  });

  describe("usePostQuery", () => {
    it("fetches a single post successfully", async () => {
      const mockPost = { id: 1, title: "Post 1", body: "Body 1", userId: 1 };
      vi.mocked(postsApi.getPost).mockResolvedValue(mockPost);

      const { result } = renderHook(() => usePostQuery(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockPost);
      expect(postsApi.getPost).toHaveBeenCalledWith(1);
    });

    it("does not fetch when ID is 0 or negative", () => {
      const { result } = renderHook(() => usePostQuery(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(postsApi.getPost).not.toHaveBeenCalled();
    });
  });

  describe("useCreatePostMutation", () => {
    it("creates a post and invalidates cache", async () => {
      const newPost = { id: 3, title: "New Post", body: "New Body", userId: 1 };
      vi.mocked(postsApi.createPost).mockResolvedValue(newPost);

      const { result } = renderHook(() => useCreatePostMutation(), {
        wrapper: createWrapper(),
      });

      const input = { title: "New Post", body: "New Body", userId: 1 };
      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(postsApi.createPost).toHaveBeenCalledWith(input);
      expect(result.current.data).toEqual(newPost);

      // Verify the new post is in cache
      const cachedPost = queryClient.getQueryData(postKeys.detail(newPost.id));
      expect(cachedPost).toEqual(newPost);
    });
  });

  describe("useUpdatePostMutation", () => {
    it("updates detail and list caches optimistically and invalidates on settle", async () => {
      const existingPost = {
        id: 1,
        title: "Original",
        body: "Original body",
        userId: 1,
      };
      const updatedPost = {
        id: 1,
        title: "Updated",
        body: "Updated body",
        userId: 1,
      };

      const paginatedListKey = postKeys.list({ page: 1, limit: 10 });
      const previousList = [
        existingPost,
        { id: 2, title: "Second", body: "Second body", userId: 2 },
      ];

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Pre-populate caches with existing post.
      queryClient.setQueryData(postKeys.detail(1), existingPost);
      queryClient.setQueryData(paginatedListKey, previousList);

      vi.mocked(postsApi.updatePost).mockResolvedValue(updatedPost);

      const { result } = renderHook(() => useUpdatePostMutation(), {
        wrapper: createWrapper(),
      });

      const updateData = { title: "Updated", body: "Updated body" };
      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        const optimisticallyUpdatedDetail = queryClient.getQueryData<Post>(
          postKeys.detail(1)
        );
        const optimisticallyUpdatedList = queryClient.getQueryData<Post[]>(
          paginatedListKey
        );

        expect(optimisticallyUpdatedDetail).toMatchObject(updateData);
        expect(optimisticallyUpdatedList?.[0]).toMatchObject(updateData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(postsApi.updatePost).toHaveBeenCalledWith(1, updateData);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: postKeys.detail(1),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: postKeys.lists(),
      });
    });

    it("rolls back detail and list caches on mutation error", async () => {
      const existingPost = {
        id: 1,
        title: "Original",
        body: "Original body",
        userId: 1,
      };

      const paginatedListKey = postKeys.list({ page: 1, limit: 10 });
      const previousList = [
        existingPost,
        { id: 2, title: "Second", body: "Second body", userId: 2 },
      ];

      queryClient.setQueryData(postKeys.detail(1), existingPost);
      queryClient.setQueryData(paginatedListKey, previousList);

      vi.mocked(postsApi.updatePost).mockRejectedValue(new Error("Update failed"));

      const { result } = renderHook(() => useUpdatePostMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 1,
        data: { title: "Updated", body: "Updated body" },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      const rolledBackDetail = queryClient.getQueryData<Post>(postKeys.detail(1));
      const rolledBackList = queryClient.getQueryData<Post[]>(paginatedListKey);

      expect(rolledBackDetail).toEqual(existingPost);
      expect(rolledBackList).toEqual(previousList);
    });
  });

  describe("useDeletePostMutation", () => {
    it("deletes a post and removes from cache", async () => {
      const post = { id: 1, title: "Post 1", body: "Body 1", userId: 1 };

      // Pre-populate cache
      queryClient.setQueryData(postKeys.detail(1), post);

      vi.mocked(postsApi.deletePost).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePostMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(postsApi.deletePost).toHaveBeenCalledWith(1);

      // Verify post is removed from cache
      const cachedPost = queryClient.getQueryData(postKeys.detail(1));
      expect(cachedPost).toBeUndefined();
    });
  });

  describe("postKeys", () => {
    it("generates correct query keys", () => {
      expect(postKeys.all).toEqual(["posts"]);
      expect(postKeys.lists()).toEqual(["posts", "list"]);
      expect(postKeys.list({ page: 1 })).toEqual(["posts", "list", { page: 1 }]);
      expect(postKeys.details()).toEqual(["posts", "detail"]);
      expect(postKeys.detail(1)).toEqual(["posts", "detail", 1]);
    });
  });
});
