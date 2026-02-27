import { useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { feedbackApi } from "@/lib/feedbackApi";

import type { Comment, FeedbackItem } from "@/types/api";

/**
 * Query keys for feedback
 */
export const feedbackKeys = {
  all: ["feedback"] as const,
  lists: () => [...feedbackKeys.all] as const,
  list: (filter: "active" | "merged") =>
    [...feedbackKeys.all, filter] as const,
  detail: (id: string) => [...feedbackKeys.all, id] as const,
  hasVoted: (feedbackId: string, userId: string) =>
    ["hasVoted", feedbackId, userId] as const,
  comments: (feedbackId: string) => ["comments", feedbackId] as const,
};

export const useFeedbackRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubActive = feedbackApi.subscribeToActiveFeedback((items) => {
      queryClient.setQueryData(feedbackKeys.list("active"), items);
    });
    const unsubMerged = feedbackApi.subscribeToMergedFeedback((items) => {
      queryClient.setQueryData(feedbackKeys.list("merged"), items);
    });
    return () => {
      unsubActive();
      unsubMerged();
    };
  }, [queryClient]);
};

interface AddVoteVariables {
  feedbackId: string;
  userId: string;
}

/**
 * Hook to add a vote with optimistic update
 */
export const useAddVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId, userId }: AddVoteVariables) =>
      feedbackApi.addVote(feedbackId, userId),
    onMutate: async ({ feedbackId, userId }: AddVoteVariables) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedbackKeys.list("active") }),
        queryClient.cancelQueries({ queryKey: feedbackKeys.list("merged") }),
        queryClient.cancelQueries({ queryKey: feedbackKeys.detail(feedbackId) }),
        queryClient.cancelQueries({
          queryKey: feedbackKeys.hasVoted(feedbackId, userId),
        }),
      ]);

      const previousActive = queryClient.getQueryData<FeedbackItem[]>(
        feedbackKeys.list("active")
      );
      const previousMerged = queryClient.getQueryData<FeedbackItem[]>(
        feedbackKeys.list("merged")
      );
      const previousDetail = queryClient.getQueryData<FeedbackItem>(
        feedbackKeys.detail(feedbackId)
      );
      const previousHasVoted = queryClient.getQueryData<boolean>(
        feedbackKeys.hasVoted(feedbackId, userId)
      );

      const incrementVotes = (item: FeedbackItem) =>
        item.id === feedbackId
          ? { ...item, votes: item.votes + 1 }
          : item;

      if (previousActive) {
        queryClient.setQueryData<FeedbackItem[]>(
          feedbackKeys.list("active"),
          previousActive.map(incrementVotes)
        );
      }

      if (previousMerged) {
        queryClient.setQueryData<FeedbackItem[]>(
          feedbackKeys.list("merged"),
          previousMerged.map(incrementVotes)
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<FeedbackItem>(
          feedbackKeys.detail(feedbackId),
          { ...previousDetail, votes: previousDetail.votes + 1 }
        );
      }

      queryClient.setQueryData(
        feedbackKeys.hasVoted(feedbackId, userId),
        true
      );

      return {
        previousActive,
        previousMerged,
        previousDetail,
        previousHasVoted,
      };
    },
    onError: (_error, { feedbackId, userId }, context) => {
      if (!context) return;

      const {
        previousActive,
        previousMerged,
        previousDetail,
        previousHasVoted,
      } = context;

      if (previousActive) {
        queryClient.setQueryData(
          feedbackKeys.list("active"),
          previousActive
        );
      }
      if (previousMerged) {
        queryClient.setQueryData(
          feedbackKeys.list("merged"),
          previousMerged
        );
      }
      if (previousDetail) {
        queryClient.setQueryData(
          feedbackKeys.detail(feedbackId),
          previousDetail
        );
      }
      queryClient.setQueryData(
        feedbackKeys.hasVoted(feedbackId, userId),
        previousHasVoted
      );
    },
    onSettled: (_data, _error, { feedbackId, userId }) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.hasVoted(feedbackId, userId),
      });
    },
  });
};

interface AddCommentVariables {
  feedbackId: string;
  text: string;
  userIdentifier: string;
  optimisticId?: string;
}

export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId, text, userIdentifier }: AddCommentVariables) =>
      feedbackApi.addComment(feedbackId, text, userIdentifier),
    onMutate: async ({
      feedbackId,
      text,
      userIdentifier,
      optimisticId,
    }: AddCommentVariables) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedbackKeys.comments(feedbackId) }),
        queryClient.cancelQueries({ queryKey: feedbackKeys.list("active") }),
        queryClient.cancelQueries({ queryKey: feedbackKeys.list("merged") }),
        queryClient.cancelQueries({ queryKey: feedbackKeys.detail(feedbackId) }),
      ]);

      const previousComments = queryClient.getQueryData<Comment[]>(
        feedbackKeys.comments(feedbackId)
      );
      const previousActive = queryClient.getQueryData<FeedbackItem[]>(
        feedbackKeys.list("active")
      );
      const previousMerged = queryClient.getQueryData<FeedbackItem[]>(
        feedbackKeys.list("merged")
      );
      const previousDetail = queryClient.getQueryData<FeedbackItem>(
        feedbackKeys.detail(feedbackId)
      );

      const optimisticComment: Comment = {
        id: optimisticId ?? `optimistic-${Date.now()}`,
        itemId: feedbackId,
        text,
        userIdentifier,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Comment[]>(
        feedbackKeys.comments(feedbackId),
        [...(previousComments ?? []), optimisticComment]
      );

      const incrementCommentCount = (item: FeedbackItem) =>
        item.id === feedbackId
          ? { ...item, commentCount: item.commentCount + 1 }
          : item;

      if (previousActive) {
        queryClient.setQueryData<FeedbackItem[]>(
          feedbackKeys.list("active"),
          previousActive.map(incrementCommentCount)
        );
      }

      if (previousMerged) {
        queryClient.setQueryData<FeedbackItem[]>(
          feedbackKeys.list("merged"),
          previousMerged.map(incrementCommentCount)
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<FeedbackItem>(
          feedbackKeys.detail(feedbackId),
          { ...previousDetail, commentCount: previousDetail.commentCount + 1 }
        );
      }

      return { previousComments, previousActive, previousMerged, previousDetail };
    },
    onSuccess: (newCommentId, { feedbackId, text, userIdentifier }) => {
      queryClient.setQueryData<Comment[]>(
        feedbackKeys.comments(feedbackId),
        (old) => {
          if (!old) return old;
          const withoutOptimistic = old.filter(
            (c) => !c.id.startsWith("optimistic-")
          );
          return [
            ...withoutOptimistic,
            {
              id: newCommentId,
              itemId: feedbackId,
              text,
              userIdentifier,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      );
    },
    onError: (_error, { feedbackId }, context) => {
      if (!context) return;

      const { previousComments, previousActive, previousMerged, previousDetail } = context;

      if (previousComments !== undefined) {
        queryClient.setQueryData(feedbackKeys.comments(feedbackId), previousComments);
      }
      if (previousActive) {
        queryClient.setQueryData(feedbackKeys.list("active"), previousActive);
      }
      if (previousMerged) {
        queryClient.setQueryData(feedbackKeys.list("merged"), previousMerged);
      }
      if (previousDetail) {
        queryClient.setQueryData(feedbackKeys.detail(feedbackId), previousDetail);
      }
    },
    onSettled: (_data, _error, { feedbackId }) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.comments(feedbackId) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
    },
  });
};
