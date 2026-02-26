import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiException, postsApi } from "./api";

describe("postsApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns typed post data for valid JSON responses", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          userId: 1,
          title: "Valid title",
          body: "Valid body",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    const result = await postsApi.getPost(1);

    expect(result).toEqual({
      id: 1,
      userId: 1,
      title: "Valid title",
      body: "Valid body",
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("handles 204 responses safely for delete requests", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(postsApi.deletePost(1)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("uses safe fallback message for non-JSON error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "text/plain",
        },
      })
    );

    await expect(postsApi.getPost(1)).rejects.toMatchObject({
      name: "ApiException",
      status: 503,
      code: "HTTP_ERROR",
      message: "Service unavailable",
    });
  });

  it("throws a normalized timeout error when request exceeds timeout", async () => {
    vi.useFakeTimers();

    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;

        signal?.addEventListener("abort", () => {
          reject(new DOMException("Request aborted", "AbortError"));
        });
      });
    });

    const requestPromise = expect(postsApi.getPost(1)).rejects.toMatchObject({
      name: "ApiException",
      status: 408,
      code: "TIMEOUT_ERROR",
      message: "Request timed out",
    });

    await vi.advanceTimersByTimeAsync(10000);
    await requestPromise;
  });

  it("throws validation error when external payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          userId: 1,
          title: "Missing body field",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    try {
      await postsApi.getPost(1);
      throw new Error("Expected postsApi.getPost to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect(error).toMatchObject({
        status: 502,
        code: "VALIDATION_ERROR",
        message: "Invalid post response from API",
      });
    }
  });
});
