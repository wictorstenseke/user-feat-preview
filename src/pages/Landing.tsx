import { useState, useRef, useEffect } from "react";

import {
  ArrowUp,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  Square,
  ThumbsUp,
} from "lucide-react";

import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ItemDetailDialog } from "@/components/ui/item-detail-dialog";
import { Message } from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  feedbackKeys,
  useAddVoteMutation,
  useFeedbackRealtimeSync,
} from "@/hooks/useFeedback";
import { USE_AGENT_MODE } from "@/lib/chatConfig";
import { createLocalDraft, feedbackApi } from "@/lib/feedbackApi";
import {
  pickRandom,
  DRAFT_INTRO_MESSAGES,
  DRAFT_UPDATE_MESSAGES,
  DRAFT_FOLLOWUP_MESSAGES,
} from "@/lib/chatMessages";
import { cn, formatRelativeDate } from "@/lib/utils";

import type { DraftFeedback, FeedbackItem } from "@/types/api";

interface AssistantMessage {
  role: "assistant";
  content: string;
  draft?: DraftFeedback;
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
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    summary?: string;
  } | null>(null);
  const [isChatAtBottom, setIsChatAtBottom] = useState(true);
  const chatWrapperRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const wrapper = chatWrapperRef.current;
    if (!wrapper) return;
    const scrollEl = wrapper.querySelector(
      '[role="log"]'
    ) as HTMLElement | null;
    if (!scrollEl) return;

    const newMessageAdded = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    requestAnimationFrame(() => {
      if (newMessageAdded) {
        scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
      }
      setIsChatAtBottom(
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 20
      );
    });
  }, [messages]);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [userIdentifier] = useState<string>(() => {
    const stored = localStorage.getItem("userIdentifier");
    if (stored) return stored;
    const generated = `User-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("userIdentifier", generated);
    return generated;
  });

  useFeedbackRealtimeSync();

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
      const priorUserText = messages
        .filter((m): m is UserMessage => m.role === "user")
        .map((m) => m.content)
        .join("\n\n");
      const contextText = draft
        ? `${priorUserText}\n${messageText}`
        : messageText;

      const generatedDraft = USE_AGENT_MODE
        ? await feedbackApi.generateDraft(contextText, "")
        : await new Promise<ReturnType<typeof createLocalDraft>>((resolve) =>
            setTimeout(() => resolve(createLocalDraft(contextText)), 800)
          );

      const cleanedDraft = {
        ...generatedDraft,
        title: draft?.title?.trim() ? draft.title : "",
      };

      setDraft(cleanedDraft);
      setValidationErrors(null);

      const introText = draft
        ? pickRandom(DRAFT_UPDATE_MESSAGES)
        : pickRandom(DRAFT_INTRO_MESSAGES);

      const assistantMessages: ChatMessage[] = [
        { role: "assistant", content: introText, draft: cleanedDraft },
        {
          role: "assistant",
          content: pickRandom(DRAFT_FOLLOWUP_MESSAGES),
        },
      ];

      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch (error) {
      console.error("Failed to generate draft:", error);
      const priorUserText = messages
        .filter((m): m is UserMessage => m.role === "user")
        .map((m) => m.content)
        .join("\n\n");
      const contextText = draft
        ? `${priorUserText}\n${messageText}`
        : messageText;
      const fallbackDraft = createLocalDraft(contextText);
      const cleanedDraft = {
        ...fallbackDraft,
        title: draft?.title?.trim() ? draft.title : "",
      };
      setDraft(cleanedDraft);
      setValidationErrors(null);
      const assistantMessages: ChatMessage[] = [
        {
          role: "assistant",
          content:
            "We couldn't reach the AI assistant, but here's a draft you can edit and submit.",
          draft: cleanedDraft,
        },
        {
          role: "assistant",
          content: pickRandom(DRAFT_FOLLOWUP_MESSAGES),
        },
      ];
      setMessages((prev) => [...prev, ...assistantMessages]);
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

    const errors: { title?: string; summary?: string } = {};
    if (!draft.title.trim()) errors.title = "Title is required";
    if (!draft.summary.trim()) errors.summary = "Description is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors(null);
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
        (old) => [optimisticItem, ...(old ?? [])]
      );

      setInput("");
      setDraft(null);
      setValidationErrors(null);
      setMessages((prev) => {
        const updated = [...prev];
        let lastDraftIdx = -1;
        for (let i = updated.length - 1; i >= 0; i--) {
          const m = updated[i];
          if (m.role === "assistant" && (m as AssistantMessage).draft) {
            lastDraftIdx = i;
            break;
          }
        }
        if (lastDraftIdx >= 0) {
          const msg = updated[lastDraftIdx] as AssistantMessage;
          updated[lastDraftIdx] = {
            ...msg,
            draft: {
              ...msg.draft!,
              title: draft.title,
              summary: draft.summary,
            },
          };
        }
        return [
          ...updated,
          {
            role: "assistant" as const,
            content:
              "Your feedback has been submitted — thank you! We'll review it and keep you posted on any updates.",
          },
        ];
      });

      queryClient.invalidateQueries({ queryKey: feedbackKeys.list("active") });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content:
            "Something went wrong while submitting your feedback. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenItemDetail = (itemId: string) => {
    setDetailItemId(itemId);
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-12 py-12">
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
          <div
            ref={chatWrapperRef}
            className="relative min-h-[80px] max-h-[60vh] flex flex-col overflow-hidden rounded-3xl border border-border"
          >
            <ChatContainerRoot
              className="h-full min-h-0 overflow-y-scroll"
              onScroll={(e) => {
                const el = e.currentTarget;
                setIsChatAtBottom(
                  el.scrollHeight - el.scrollTop - el.clientHeight < 20
                );
              }}
            >
              <ChatContainerContent className="space-y-4 p-4">
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
                  const lastDraftIndex = (() => {
                    for (let j = messages.length - 1; j >= 0; j--) {
                      const m = messages[j];
                      if (
                        m.role === "assistant" &&
                        (m as AssistantMessage).draft
                      )
                        return j;
                    }
                    return -1;
                  })();
                  const isLatestDraft = draft !== null && i === lastDraftIndex;

                  return (
                    <div key={i} className="space-y-3">
                      <Message className="justify-start">
                        <div className="bg-secondary rounded-3xl px-5 py-2.5 text-sm max-w-[80%] wrap-break-word whitespace-pre-wrap">
                          {assistantMsg.content}
                        </div>
                      </Message>

                      {assistantMsg.draft && (
                        <Message className="justify-start w-full">
                          <div
                            className={cn(
                              "w-full rounded-3xl space-y-3",
                              isLatestDraft && draft
                                ? "bg-background"
                                : "border border-border p-4"
                            )}
                          >
                            {isLatestDraft && draft ? (
                              <>
                                <div className="space-y-1">
                                  <label
                                    htmlFor="draft-title"
                                    className="sr-only"
                                  >
                                    Feedback title
                                  </label>
                                  <Input
                                    id="draft-title"
                                    value={draft.title}
                                    onChange={(e) => {
                                      setDraft((prev) =>
                                        prev
                                          ? { ...prev, title: e.target.value }
                                          : null
                                      );
                                      setValidationErrors((prev) => {
                                        if (!prev) return null;
                                        const next = {
                                          ...prev,
                                          title: undefined,
                                        };
                                        return Object.values(next).some(Boolean)
                                          ? next
                                          : null;
                                      });
                                    }}
                                    placeholder="Please add title"
                                    className="font-semibold text-sm h-8 text-foreground placeholder:font-normal placeholder:italic"
                                    maxLength={200}
                                    aria-invalid={!!validationErrors?.title}
                                    aria-describedby={
                                      validationErrors?.title
                                        ? "draft-title-error"
                                        : undefined
                                    }
                                  />
                                  {validationErrors?.title && (
                                    <p
                                      id="draft-title-error"
                                      className="text-xs text-destructive"
                                    >
                                      {validationErrors.title}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <label
                                    htmlFor="draft-summary"
                                    className="sr-only"
                                  >
                                    Feedback description
                                  </label>
                                  <Textarea
                                    id="draft-summary"
                                    value={draft.summary}
                                    onChange={(e) => {
                                      setDraft((prev) =>
                                        prev
                                          ? { ...prev, summary: e.target.value }
                                          : null
                                      );
                                      setValidationErrors((prev) => {
                                        if (!prev) return null;
                                        const next = {
                                          ...prev,
                                          summary: undefined,
                                        };
                                        return Object.values(next).some(Boolean)
                                          ? next
                                          : null;
                                      });
                                    }}
                                    placeholder="Describe your feature request or bug report..."
                                    className="text-sm text-foreground leading-relaxed min-h-[100px] resize-y"
                                    maxLength={5000}
                                    aria-invalid={!!validationErrors?.summary}
                                    aria-describedby={
                                      validationErrors?.summary
                                        ? "draft-summary-error"
                                        : undefined
                                    }
                                  />
                                  {validationErrors?.summary && (
                                    <p
                                      id="draft-summary-error"
                                      className="text-xs text-destructive"
                                    >
                                      {validationErrors.summary}
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                {assistantMsg.draft.title && (
                                  <p className="font-semibold text-sm leading-snug">
                                    {assistantMsg.draft.title}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {assistantMsg.draft.summary}
                                </p>
                              </>
                            )}

                            {assistantMsg.draft.type === "bug" &&
                              assistantMsg.draft.details && (
                                <div className="space-y-2 pt-1 text-sm">
                                  {assistantMsg.draft.details
                                    .stepsToReproduce && (
                                    <div>
                                      <p className="font-semibold text-xs text-muted-foreground mb-0.5">
                                        STEPS TO REPRODUCE
                                      </p>
                                      <p className="text-foreground">
                                        {
                                          assistantMsg.draft.details
                                            .stepsToReproduce
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {assistantMsg.draft.details
                                    .expectedBehavior && (
                                    <div>
                                      <p className="font-semibold text-xs text-muted-foreground mb-0.5">
                                        EXPECTED BEHAVIOR
                                      </p>
                                      <p className="text-foreground">
                                        {
                                          assistantMsg.draft.details
                                            .expectedBehavior
                                        }
                                      </p>
                                    </div>
                                  )}
                                  {assistantMsg.draft.details
                                    .actualBehavior && (
                                    <div>
                                      <p className="font-semibold text-xs text-muted-foreground mb-0.5">
                                        ACTUAL BEHAVIOR
                                      </p>
                                      <p className="text-foreground">
                                        {
                                          assistantMsg.draft.details
                                            .actualBehavior
                                        }
                                      </p>
                                    </div>
                                  )}
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
            {!isChatAtBottom && (
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-background to-transparent"
                aria-hidden="true"
              />
            )}
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
          <div className="text-left text-sm text-muted-foreground">
            No feedback yet. Be the first to share!
          </div>
        ) : (
          <ItemGroup className="gap-4">
            {activeFeedback.map((item) => (
              <Item
                key={item.id}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => handleOpenItemDetail(item.id)}
              >
                <ItemContent>
                  <ItemHeader>
                    <ItemTitle>{item.title}</ItemTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.status === "new"
                            ? "secondary"
                            : item.status === "planned"
                              ? "outline"
                              : item.status === "in-progress"
                                ? "default"
                                : item.status === "preview"
                                  ? "secondary"
                                  : "secondary"
                        }
                        className={
                          item.status === "preview"
                            ? "bg-amber-200 text-amber-900 border-amber-400/60 dark:bg-amber-800/60 dark:text-amber-100 dark:border-amber-500/50"
                            : undefined
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
                  <ItemFooter className="mt-1.5 -mx-4 -mb-3 px-3 py-1.5 rounded-b-[6px] bg-muted/50">
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
                      <span>{formatRelativeDate(item.lastUpdated)}</span>
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

      {(activeFeedback.length > 0 ||
        mergedFeedback.length > 0 ||
        isLoadingMerged) && (
        <section aria-label="Recently merged">
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger
              className="group flex w-full items-center justify-between mb-4"
              aria-label="Toggle recently implemented features"
            >
              <h2 className="text-lg font-semibold">Recently implemented</h2>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
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
                <div className="text-center text-muted-foreground">
                  No merged items yet.
                </div>
              ) : (
                <ItemGroup className="gap-4">
                  {mergedFeedback.map((item) => (
                    <Item
                      key={item.id}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:border-primary/60 transition-colors"
                      onClick={() => handleOpenItemDetail(item.id)}
                    >
                      <ItemContent>
                        <ItemHeader>
                          <ItemTitle>{item.title}</ItemTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">Merged</Badge>
                          </div>
                        </ItemHeader>
                        <ItemDescription>{item.summary}</ItemDescription>
                        <ItemFooter className="mt-1.5 -mx-4 -mb-3 px-3 py-1.5 rounded-b-[6px] bg-muted/50">
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
                            <span>{formatRelativeDate(item.lastUpdated)}</span>
                          </div>
                        </ItemFooter>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </CollapsibleContent>
          </Collapsible>
        </section>
      )}

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
