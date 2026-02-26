import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { usePostsQuery } from "@/hooks/usePosts";
import { renderWithQueryClient } from "@/test/utils";

import { FeedbackList } from "./FeedbackList";

import type { Post } from "@/types/api";

vi.mock("@/hooks/usePosts");

const mockPosts: Post[] = [
  { id: 1, userId: 1, title: "Zebra feedback", body: "Body of zebra" },
  { id: 3, userId: 1, title: "Alpha feedback", body: "Body of alpha" },
  { id: 2, userId: 1, title: "Middle feedback", body: "Body of middle" },
];

describe("FeedbackList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading message while fetching", () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    expect(screen.getByText(/loading feedback items/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    expect(
      screen.getByText(/failed to load feedback items/i)
    ).toBeInTheDocument();
  });

  it("renders all feedback items", () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: mockPosts,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    expect(screen.getByText("Zebra feedback")).toBeInTheDocument();
    expect(screen.getByText("Alpha feedback")).toBeInTheDocument();
    expect(screen.getByText("Middle feedback")).toBeInTheDocument();
  });

  it("sorts items by last updated (ID descending) by default", () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: mockPosts,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent);

    expect(headings).toEqual([
      "Alpha feedback", // id 3
      "Middle feedback", // id 2
      "Zebra feedback", // id 1
    ]);
  });

  it("sorts items alphabetically when 'Alphabetical' is selected", async () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: mockPosts,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    const select = screen.getByRole("combobox", { name: /sort feedback items/i });
    await userEvent.selectOptions(select, "alphabetical");

    await waitFor(() => {
      const headings = screen
        .getAllByRole("heading", { level: 3 })
        .map((el) => el.textContent);

      expect(headings).toEqual([
        "Alpha feedback",
        "Middle feedback",
        "Zebra feedback",
      ]);
    });
  });

  it("shows the correct item count", () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: mockPosts,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("shows singular 'item' when there is exactly one post", () => {
    vi.mocked(usePostsQuery).mockReturnValue({
      data: [mockPosts[0]],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePostsQuery>);

    renderWithQueryClient(<FeedbackList />);

    expect(screen.getByText("1 item")).toBeInTheDocument();
  });
});
