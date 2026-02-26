import { useState } from "react";

import { ArrowUp, ExternalLink, MessageCircle, Square, ThumbsUp } from "lucide-react";

import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { ItemDetailDialog } from "@/components/ui/item-detail-dialog";
import { Message } from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { Skeleton } from "@/components/ui/skeleton";
import { feedbackKeys, useAddVoteMutation } from "@/hooks/useFeedback";
import { feedbackApi } from "@/lib/feedbackApi";
import { cn } from "@/lib/utils";

import type { DraftFeedback, FeedbackItem } from "@/types/api";

const PROMPT_SUGGESTIONS: { label: string; text: string }[] = [
  {
    label: "I found a bug",
    text: "I want to report functionality that does not work as I expected.",
  },
  {
    label: "Suggest a new feature",
    text: "I have an idea for a new feature that would improve the product.",
  },
  {
    label: "Request a UI improvement",
    text: "I would like to suggest an improvement to the user interface.",
  },
];

interface AssistantMessage {
  role: "assistant";
  content: string;
  draft?: DraftFeedback;
  duplicates?: FeedbackItem[];
}

interface UserMessage {
  role: "user";
  content: string;
}

type ChatMessage = UserMessage | AssistantMessage;

const FeedbackCardSkeleton = () => (
  <Item variant="outline" size="sm">
    <ItemContent>
      <ItemHeader>
        <Skeleton className="h-4 w-3/5" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </ItemHeader>
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <ItemFooter>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-24" />
        </div>
      </ItemFooter>
    </ItemContent>
  </Item>
);

export function Landing() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<DraftFeedback | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [userIdentifier] = useState<string>(() => {
    const stored = localStorage.getItem("userIdentifier");
    if (stored) return stored;
    const generated = `User-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("userIdentifier", generated);
    return generated;
  });

  const { data: activeFeedback = [], isLoading: isLoadingActive } = useQuery({
    queryKey: feedbackKeys.list("active"),
    queryFn: () => feedbackApi.getActiveFeedback(),
    staleTime: 30000,
  });

  const { data: mergedFeedback = [], isLoading: isLoadingMerged } = useQuery({
    queryKey: feedbackKeys.list("merged"),
    queryFn: () => feedbackApi.getMergedFeedback(),
    staleTime: 30000,
  });

  const allFeedbackIds = [
    ...activeFeedback.map((i) => i.id),
    ...mergedFeedback.map((i) => i.id),
  ];

  const hasVotedQueries = useQueries({
    queries: allFeedbackIds.map((id) => ({
      queryKey: feedbackKeys.hasVoted(id, userIdentifier),
      queryFn: () => feedbackApi.hasUserVoted(id, userIdentifier),
      enabled: !!userIdentifier && allFeedbackIds.length > 0,
    })),
  });

  const votedIds = new Set(
    allFeedbackIds.filter((_, i) => hasVotedQueries[i]?.data === true)
  );

  const queryClient = useQueryClient();
  const addVoteMutation = useAddVoteMutation();

  const handleVoteFromList = (itemId: string) => {
    if (votedIds.has(itemId)) return;
    addVoteMutation.mutate({ feedbackId: itemId, userId: userIdentifier });
  };

  const handleGenerateDraft = async (messageText: string) => {
    const userMsg: UserMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      let contextText: string;

      if (draft) {
        const priorUserText = messages
          .filter((m): m is UserMessage => m.role === "user")
          .map((m) => m.content)
          .join("\n\n");
        contextText = [
          priorUserText,
          "[Current draft]",
          `Title: ${draft.title}`,
          `Type: ${draft.type}`,
          `Description: ${draft.summary}`,
          "",
          `[Refinement request]: ${messageText}`,
        ].join("\n");
      } else {
        contextText = messageText;
      }

      const generatedDraft = await feedbackApi.generateDraft(contextText, "");
      setDraft(generatedDraft);

      const possibleDuplicates = await feedbackApi.searchDuplicates(
        generatedDraft.title,
        5
      );

      const introText = generatedDraft.isFallback
        ? "I couldn't fully analyze your request, but here's a basic draft. Feel free to refine it by sending another message."
        : draft
          ? "I've updated the draft based on your feedback:"
          : "Here's what I've drafted based on your input:";

      const assistantMessages: ChatMessage[] = [
        { role: "assistant", content: introText, draft: generatedDraft, duplicates: possibleDuplicates },
      ];

      if (generatedDraft.followUpQuestion) {
        assistantMessages.push({ role: "assistant", content: generatedDraft.followUpQuestion });
      }

      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch (error) {
      console.error("Failed to generate draft:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong while generating your draft. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLoading) {
      setIsLoading(false);
      return;
    }

    if (!input.trim()) return;

    handleGenerateDraft(input.trim());
  };

  const handleSubmitFeedback = async () => {
    if (!draft || isLoading) return;

    setIsLoading(true);
    try {
      const result = await feedbackApi.createFeedback(
        {
          title: draft.title,
          summary: draft.summary,
          type: draft.type,
          details: draft.details,
        },
        ""
      );

      const optimisticItem: FeedbackItem = {
        id: result.id,
        title: draft.title,
        summary: draft.summary,
        type: draft.type,
        status: "new",
        details: draft.details,
        votes: 0,
        commentCount: 0,
        lastUpdated: new Date().toLocaleString(),
        githubIssueNumber: result.issueNumber,
        githubIssueUrl: result.issueNumber
          ? `https://github.com/${import.meta.env.VITE_GITHUB_REPO_OWNER ?? ""}/${import.meta.env.VITE_GITHUB_REPO_NAME ?? ""}/issues/${result.issueNumber}`
          : undefined,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<FeedbackItem[]>(
        feedbackKeys.list("active"),
        (old) => [optimisticItem, ...(old ?? [])],
      );

      setInput("");
      setDraft(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Your feedback has been submitted — thank you! We'll review it and keep you posted on any updates.",
        },
      ]);

      queryClient.invalidateQueries({ queryKey: feedbackKeys.list("active") });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: "Something went wrong while submitting your feedback. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvoteDuplicate = async (itemId: string) => {
    try {
      await feedbackApi.addVote(itemId, userIdentifier);
      setDraft(null);
      setMessages([]);
    } catch (error) {
      console.error("Failed to upvote duplicate:", error);
    }
  };

  const handleOpenItemDetail = (itemId: string) => {
    setDetailItemId(itemId);
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 py-12">
      <div className="text-center">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight md:text-3xl">
          How can I help?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Share your feature requests and bug reports.
        </p>
      </div>

      <div className="w-full space-y-3">
        {/* Chat thread — visible once a user has submitted input */}
        {hasConversation && (
          <div className="min-h-[80px] max-h-[60vh]">
            <ChatContainerRoot className="h-full">
              <ChatContainerContent className="space-y-4 p-1 pb-4">
                {messages.map((msg, i) => {
                  if (msg.role === "user") {
                    return (
                      <Message key={i} className="justify-end">
                        <div className="bg-muted rounded-3xl px-5 py-2.5 text-sm max-w-[80%] wrap-break-word whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </Message>
                    );
                  }

                  const assistantMsg = msg as AssistantMessage;
                  const isLatestDraft = assistantMsg.draft && assistantMsg.draft === draft;

                  return (
                    <div key={i} className="space-y-3">
                      <Message className="justify-start">
                        <div className="bg-secondary rounded-3xl px-5 py-2.5 text-sm max-w-[80%] wrap-break-word whitespace-pre-wrap">
                          {assistantMsg.content}
                        </div>
                      </Message>

                      {assistantMsg.draft && (
                        <Message className="justify-start w-full">
                          <div className="w-full rounded-2xl border border-input bg-background p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={assistantMsg.draft.type === "feature" ? "default" : "destructive"}>
                                {assistantMsg.draft.type === "feature" ? "Feature" : "Bug"}
                              </Badge>
                            </div>

                            <p className="font-semibold text-sm leading-snug">{assistantMsg.draft.title}</p>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {assistantMsg.draft.summary}
                            </p>

                            {assistantMsg.draft.type === "bug" && assistantMsg.draft.details && (
                              <div className="space-y-2 pt-1 text-sm">
                                {assistantMsg.draft.details.stepsToReproduce && (
                                  <div>
                                    <p className="font-semibold text-xs text-muted-foreground mb-0.5">
                                      STEPS TO REPRODUCE
                                    </p>
                                    <p className="text-foreground">{assistantMsg.draft.details.stepsToReproduce}</p>
                                  </div>
                                )}
                                {assistantMsg.draft.details.expectedBehavior && (
                                  <div>
                                    <p className="font-semibold text-xs text-muted-foreground mb-0.5">
                                      EXPECTED BEHAVIOR
                                    </p>
                                    <p className="text-foreground">{assistantMsg.draft.details.expectedBehavior}</p>
                                  </div>
                                )}
                                {assistantMsg.draft.details.actualBehavior && (
                                  <div>
                                    <p className="font-semibold text-xs text-muted-foreground mb-0.5">
                                      ACTUAL BEHAVIOR
                                    </p>
                                    <p className="text-foreground">{assistantMsg.draft.details.actualBehavior}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {assistantMsg.duplicates && assistantMsg.duplicates.length > 0 && (
                              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
                                  Possible duplicates found
                                </p>
                                <div className="space-y-2">
                                  {assistantMsg.duplicates.map((duplicate) => (
                                    <div
                                      key={duplicate.id}
                                      className="flex items-center justify-between p-2 rounded bg-white dark:bg-amber-900/20"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {duplicate.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {duplicate.type === "feature" ? "Feature" : "Bug"}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            {duplicate.status}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {duplicate.votes} votes
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenItemDetail(duplicate.id)}
                                        >
                                          View
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => handleUpvoteDuplicate(duplicate.id)}
                                        >
                                          Upvote
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isLatestDraft && (
                              <div className="pt-1 flex justify-end">
                                <Button
                                  variant="default"
                                  onClick={handleSubmitFeedback}
                                  disabled={isLoading}
                                >
                                  Submit feedback
                                </Button>
                              </div>
                            )}
                          </div>
                        </Message>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <Message className="justify-start">
                    <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </div>
                  </Message>
                )}

                <ChatContainerScrollAnchor />
              </ChatContainerContent>
            </ChatContainerRoot>
          </div>
        )}

        {/* Composer — always visible */}
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea placeholder="Describe your feature request or bug report..." />
          <PromptInputActions className="justify-end pt-2">
            <PromptInputAction
              tooltip={isLoading ? "Generating..." : "Generate draft"}
            >
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                aria-label={isLoading ? "Generating..." : "Generate draft"}
              >
                {isLoading ? (
                  <Square className="size-5 fill-current" />
                ) : (
                  <ArrowUp className="size-5" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
        <input
          type="text"
          name="honeypot"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Suggestion pills shown in empty state */}
        {!hasConversation && !input.trim() && (
          <div className="flex flex-wrap gap-2 justify-start pt-1">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <PromptSuggestion
                key={suggestion.label}
                size="sm"
                onClick={() => setInput(suggestion.text)}
              >
                {suggestion.label}
              </PromptSuggestion>
            ))}
          </div>
        )}
      </div>

      <section aria-label="Feedback list">
        <h2 className="mb-4 text-lg font-semibold">Feedback</h2>
        {isLoadingActive ? (
          <ItemGroup className="gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <FeedbackCardSkeleton key={i} />
            ))}
          </ItemGroup>
        ) : activeFeedback.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No feedback yet. Be the first to share!
          </div>
        ) : (
          <ItemGroup className="gap-4">
            {activeFeedback.map((item) => (
              <Item
                key={item.id}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleOpenItemDetail(item.id)}
              >
                <ItemContent>
                  <ItemHeader>
                    <ItemTitle>{item.title}</ItemTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={item.type === "feature" ? "default" : "destructive"}
                      >
                        {item.type === "feature" ? "Feature" : "Bug"}
                      </Badge>
                      <Badge
                        variant={
                          item.status === "new"
                            ? "secondary"
                            : item.status === "planned"
                              ? "outline"
                              : item.status === "in-progress"
                                ? "default"
                                : item.status === "preview"
                                  ? "link"
                                  : "secondary"
                        }
                      >
                        {item.status === "new"
                          ? "New"
                          : item.status === "planned"
                            ? "Planned"
                            : item.status === "in-progress"
                              ? "In progress"
                              : item.status === "preview"
                                ? "Preview"
                                : "Merged"}
                      </Badge>
                    </div>
                  </ItemHeader>
                  <ItemDescription>{item.summary}</ItemDescription>
                  <ItemFooter>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteFromList(item.id);
                        }}
                        disabled={votedIds.has(item.id)}
                        className={cn(
                          "flex items-center gap-1 transition-colors",
                          votedIds.has(item.id)
                            ? "cursor-default text-foreground"
                            : "hover:text-foreground cursor-pointer text-muted-foreground"
                        )}
                        aria-label={
                          votedIds.has(item.id)
                            ? `You voted for ${item.title}`
                            : `Vote for ${item.title}`
                        }
                      >
                        <ThumbsUp
                          className={cn(
                            "size-3.5",
                            votedIds.has(item.id) && "fill-current"
                          )}
                        />
                        {item.votes}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItemDetail(item.id);
                        }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer text-muted-foreground"
                        aria-label={`Open item detail for ${item.title}`}
                      >
                        <MessageCircle className="size-3.5" />
                        {item.commentCount}
                      </button>
                      <span>{item.lastUpdated}</span>
                    </div>
                    <ItemActions>
                      {item.previewUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          asChild
                        >
                          <a
                            href={item.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="size-3.5" />
                            Preview
                          </a>
                        </Button>
                      )}
                    </ItemActions>
                  </ItemFooter>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </section>

      <section aria-label="Recently merged">
        <h2 className="mb-4 text-lg font-semibold">Recently implemented</h2>
        <p className="mb-4 text-muted-foreground text-sm">
          Here&apos;s what has been merged and shipped recently.
        </p>
        {isLoadingMerged ? (
          <ItemGroup className="gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <FeedbackCardSkeleton key={i} />
            ))}
          </ItemGroup>
        ) : mergedFeedback.length === 0 ? (
          <div className="text-center text-muted-foreground">No merged items yet.</div>
        ) : (
          <ItemGroup className="gap-4">
            {mergedFeedback.map((item) => (
              <Item
                key={item.id}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleOpenItemDetail(item.id)}
              >
                <ItemContent>
                  <ItemHeader>
                    <ItemTitle>{item.title}</ItemTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={item.type === "feature" ? "default" : "destructive"}
                      >
                        {item.type === "feature" ? "Feature" : "Bug"}
                      </Badge>
                      <Badge variant="secondary">Merged</Badge>
                    </div>
                  </ItemHeader>
                  <ItemDescription>{item.summary}</ItemDescription>
                  <ItemFooter>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteFromList(item.id);
                        }}
                        disabled={votedIds.has(item.id)}
                        className={cn(
                          "flex items-center gap-1 transition-colors",
                          votedIds.has(item.id)
                            ? "cursor-default text-foreground"
                            : "hover:text-foreground cursor-pointer text-muted-foreground"
                        )}
                        aria-label={
                          votedIds.has(item.id)
                            ? `You voted for ${item.title}`
                            : `Vote for ${item.title}`
                        }
                      >
                        <ThumbsUp
                          className={cn(
                            "size-3.5",
                            votedIds.has(item.id) && "fill-current"
                          )}
                        />
                        {item.votes}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItemDetail(item.id);
                        }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer text-muted-foreground"
                        aria-label={`Open item detail for ${item.title}`}
                      >
                        <MessageCircle className="size-3.5" />
                        {item.commentCount}
                      </button>
                      <span>{item.lastUpdated}</span>
                    </div>
                  </ItemFooter>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </section>

      <ItemDetailDialog
        open={detailItemId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailItemId(null);
        }}
        itemId={detailItemId || ""}
      />
    </div>
  );
}
