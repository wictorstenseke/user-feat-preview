import { useState } from "react";

import { ArrowUp, ExternalLink, MessageCircle, Square, ThumbsUp } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { feedbackApi } from "@/lib/feedbackApi";

import type { FeedbackItem } from "@/types/api";

interface Draft {
  title: string;
  summary: string;
  type: "feature" | "bug";
  details?: {
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
  };
  followUpQuestion?: string;
}

export function Landing() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [duplicates, setDuplicates] = useState<FeedbackItem[]>([]);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [userIdentifier] = useState<string>(() => {
    const stored = localStorage.getItem("userIdentifier");
    if (stored) return stored;
    const generated = `User-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("userIdentifier", generated);
    return generated;
  });

  const { data: activeFeedback = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ["feedback", "active"],
    queryFn: () => feedbackApi.getActiveFeedback(),
    staleTime: 30000,
  });

  const { data: mergedFeedback = [], isLoading: isLoadingMerged } = useQuery({
    queryKey: ["feedback", "merged"],
    queryFn: () => feedbackApi.getMergedFeedback(),
    staleTime: 30000,
  });

  const handleGenerateDraft = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const generatedDraft = await feedbackApi.generateDraft(input, "");
      setDraft(generatedDraft);
      
      const possibleDuplicates = await feedbackApi.searchDuplicates(
        generatedDraft.title,
        5
      );
      setDuplicates(possibleDuplicates);
    } catch (error) {
      console.error("Failed to generate draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) {
      setIsLoading(false);
      return;
    }

    if (!draft) {
      handleGenerateDraft();
      return;
    }

    setIsLoading(true);
    try {
      const result = await feedbackApi.createFeedback(
        {
          title: draft.title,
          summary: draft.summary,
          type: draft.type,
          details: draft.details,
        },
        "" // honeypot - intentionally empty for legitimate submissions
      );

      console.log("Feedback created:", result);
      setInput("");
      setDraft(null);
      setDuplicates([]);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvoteDuplicate = async (itemId: string) => {
    try {
      await feedbackApi.addVote(itemId, userIdentifier);
      setDraft(null);
      setDuplicates([]);
    } catch (error) {
      console.error("Failed to upvote duplicate:", error);
    }
  };

  const handleEditDraft = (field: keyof Draft, value: string) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const handleEditDraftDetail = (
    field: keyof NonNullable<Draft["details"]>,
    value: string
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      details: { ...draft.details, [field]: value },
    });
  };

  const handleOpenItemDetail = (itemId: string) => {
    setDetailItemId(itemId);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 py-12">
      <div className="text-center">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight md:text-3xl">
          How can I help?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ask anything—I&apos;m here to assist.
        </p>
      </div>

      {!draft ? (
        <div className="w-full space-y-4">
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
      ) : (
        <div className="w-full rounded-lg border border-input bg-background p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Type</label>
            <select
              value={draft.type}
              onChange={(e) => handleEditDraft("type", e.target.value as "feature" | "bug")}
              className="w-full rounded border border-input px-3 py-2 text-sm"
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => handleEditDraft("title", e.target.value)}
              className="w-full rounded border border-input px-3 py-2 text-sm"
              placeholder="Feature or bug title"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Description</label>
            <textarea
              value={draft.summary}
              onChange={(e) => handleEditDraft("summary", e.target.value)}
              className="w-full rounded border border-input px-3 py-2 text-sm resize-none"
              rows={4}
              placeholder="Detailed description"
            />
          </div>

          {draft.type === "bug" && (
            <div className="space-y-3 rounded-lg border border-input bg-muted/30 p-4">
              <p className="text-sm font-semibold">Bug details</p>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Steps to reproduce</label>
                <textarea
                  value={draft.details?.stepsToReproduce || ""}
                  onChange={(e) => handleEditDraftDetail("stepsToReproduce", e.target.value)}
                  className="w-full rounded border border-input px-3 py-2 text-sm resize-none"
                  rows={3}
                  placeholder="1. Go to... 2. Click on..."
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Expected behavior</label>
                <textarea
                  value={draft.details?.expectedBehavior || ""}
                  onChange={(e) => handleEditDraftDetail("expectedBehavior", e.target.value)}
                  className="w-full rounded border border-input px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="What should happen"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Actual behavior</label>
                <textarea
                  value={draft.details?.actualBehavior || ""}
                  onChange={(e) => handleEditDraftDetail("actualBehavior", e.target.value)}
                  className="w-full rounded border border-input px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="What actually happens"
                />
              </div>
            </div>
          )}

          {draft.followUpQuestion && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {draft.followUpQuestion}
              </p>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
                Possible duplicates found
              </p>
              <div className="space-y-2">
                {duplicates.map((duplicate) => (
                  <div key={duplicate.id} className="flex items-center justify-between p-2 rounded bg-white dark:bg-amber-900/20">
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

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDraft(null)}
              disabled={isLoading}
            >
              Edit text
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit feedback"}
            </Button>
          </div>
        </div>
      )}

      <section aria-label="Feedback list">
        <h2 className="mb-4 text-lg font-semibold">Feedback</h2>
        {isLoadingActive ? (
          <div className="text-center text-muted-foreground">Loading feedback...</div>
        ) : activeFeedback.length === 0 ? (
          <div className="text-center text-muted-foreground">No feedback yet. Be the first to share!</div>
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
                        variant={
                          item.type === "feature" ? "default" : "destructive"
                        }
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
                          feedbackApi.addVote(item.id, userIdentifier).catch(console.error);
                        }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                        aria-label={`Vote for ${item.title}`}
                      >
                        <ThumbsUp className="size-3.5" />
                        {item.votes}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItemDetail(item.id);
                        }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
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
          <div className="text-center text-muted-foreground">Loading merged items...</div>
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
                        variant={
                          item.type === "feature" ? "default" : "destructive"
                        }
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
                          feedbackApi.addVote(item.id, userIdentifier).catch(console.error);
                        }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                        aria-label={`Vote for ${item.title}`}
                      >
                        <ThumbsUp className="size-3.5" />
                        {item.votes}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItemDetail(item.id);
                        }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
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
