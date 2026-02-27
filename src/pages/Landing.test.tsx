import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { feedbackKeys } from "@/hooks/useFeedback";
import { createTestQueryClient, renderWithQueryClient } from "@/test/utils";
import type { FeedbackItem } from "@/types/api";

import { Landing } from "./Landing";

const makeFeedbackItem = (overrides: Partial<FeedbackItem>): FeedbackItem => ({
  id: "1",
  title: "Test item",
  summary: "A summary",
  type: "feature",
  status: "new",
  votes: 0,
  commentCount: 0,
  lastUpdated: new Date().toLocaleString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Landing", () => {
  it("renders the chat prompt heading", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("heading", { name: /how can i help/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/describe your feature request or bug report/i)
    ).toBeInTheDocument();
  });

  it("renders the generate draft button", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("button", { name: /generate draft/i })
    ).toBeInTheDocument();
  });

  it("accepts input and submits on button click", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Landing />);

    const input = screen.getByPlaceholderText(/describe your feature request or bug report/i);
    const sendButton = screen.getByRole("button", { name: /generate draft/i });

    await user.type(input, "Hello");
    expect(input).toHaveValue("Hello");

    await user.click(sendButton);
    // Submit starts loading; button shows "Generating..." state
    expect(sendButton).toHaveAttribute("aria-label", "Generating...");
  });

  describe("Sorting", () => {
    it("shows a sort button when there are feedback items", () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(feedbackKeys.list("active"), [
        makeFeedbackItem({ id: "1", title: "First item" }),
      ]);

      renderWithQueryClient(<Landing />, { queryClient });

      expect(screen.getByRole("button", { name: /sort/i })).toBeInTheDocument();
    });

    it("does not show a sort button when there are no feedback items", () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(feedbackKeys.list("active"), []);

      renderWithQueryClient(<Landing />, { queryClient });

      expect(screen.queryByRole("button", { name: /sort/i })).not.toBeInTheDocument();
    });

    it("shows sort options when sort button is clicked", async () => {
      const user = userEvent.setup();
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(feedbackKeys.list("active"), [
        makeFeedbackItem({ id: "1", title: "First item" }),
      ]);

      renderWithQueryClient(<Landing />, { queryClient });

      await user.click(screen.getByRole("button", { name: /sort/i }));

      expect(screen.getByRole("menuitemradio", { name: /newest first/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitemradio", { name: /oldest first/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitemradio", { name: /most upvoted/i })).toBeInTheDocument();
    });

    it("renders items sorted by most upvoted when that option is selected", async () => {
      const user = userEvent.setup();
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(feedbackKeys.list("active"), [
        makeFeedbackItem({ id: "1", title: "Low votes", votes: 1, createdAt: "2024-01-03T00:00:00.000Z" }),
        makeFeedbackItem({ id: "2", title: "High votes", votes: 99, createdAt: "2024-01-01T00:00:00.000Z" }),
        makeFeedbackItem({ id: "3", title: "Mid votes", votes: 42, createdAt: "2024-01-02T00:00:00.000Z" }),
      ]);

      renderWithQueryClient(<Landing />, { queryClient });

      await user.click(screen.getByRole("button", { name: /sort/i }));
      await user.click(screen.getByRole("menuitemradio", { name: /most upvoted/i }));

      const voteButtons = screen.getAllByRole("button", { name: /^Vote for/ });
      const orderedTitles = voteButtons.map((btn) => btn.getAttribute("aria-label")?.replace("Vote for ", ""));
      expect(orderedTitles).toEqual(["High votes", "Mid votes", "Low votes"]);
    });

    it("renders items sorted by oldest first when that option is selected", async () => {
      const user = userEvent.setup();
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(feedbackKeys.list("active"), [
        makeFeedbackItem({ id: "1", title: "Newest", createdAt: "2024-03-01T00:00:00.000Z" }),
        makeFeedbackItem({ id: "2", title: "Oldest", createdAt: "2024-01-01T00:00:00.000Z" }),
        makeFeedbackItem({ id: "3", title: "Middle", createdAt: "2024-02-01T00:00:00.000Z" }),
      ]);

      renderWithQueryClient(<Landing />, { queryClient });

      await user.click(screen.getByRole("button", { name: /sort/i }));
      await user.click(screen.getByRole("menuitemradio", { name: /oldest first/i }));

      const voteButtons = screen.getAllByRole("button", { name: /^Vote for/ });
      const orderedTitles = voteButtons.map((btn) => btn.getAttribute("aria-label")?.replace("Vote for ", ""));
      expect(orderedTitles).toEqual(["Oldest", "Middle", "Newest"]);
    });
  });
});
