import * as React from "react";

import { ArrowUp, ExternalLink, ThumbsUp } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { feedbackKeys, useAddVoteMutation } from "@/hooks/useFeedback";
import { feedbackApi } from "@/lib/feedbackApi";

interface ItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
}

const getStatusColor = (
  status: string
): "secondary" | "outline" | "default" | "destructive" | "link" => {
  switch (status) {
    case "new":
      return "secondary";
    case "planned":
      return "outline";
    case "in-progress":
      return "default";
    case "preview":
      return "link";
    case "merged":
      return "secondary";
    case "closed":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "in-progress":
      return "In progress";
    case "closed":
      return "Closed";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const ItemDetailDialog = ({
  open,
  onOpenChange,
  itemId,
}: ItemDetailDialogProps) => {
  const [commentInput, setCommentInput] = React.useState("");
  const [userIdentifier, setUserIdentifier] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addVoteMutation = useAddVoteMutation();

  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: feedbackKeys.detail(itemId),
    queryFn: () => feedbackApi.getFeedbackById(itemId),
    enabled: open,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["comments", itemId],
    queryFn: () => feedbackApi.getComments(itemId),
    enabled: open,
  });

  const { data: hasVoted = false } = useQuery({
    queryKey: feedbackKeys.hasVoted(itemId, userIdentifier),
    queryFn: () => feedbackApi.hasUserVoted(itemId, userIdentifier),
    enabled: open && !!userIdentifier,
  });

  React.useEffect(() => {
    if (!open) return;
    if (!userIdentifier) {
      const stored = localStorage.getItem("userIdentifier");
      if (stored) {
        setUserIdentifier(stored);
      } else {
        const generated = `User-${Math.random().toString(36).substring(7)}`;
        localStorage.setItem("userIdentifier", generated);
        setUserIdentifier(generated);
      }
    }
  }, [open, userIdentifier]);

  const handleAddComment = async () => {
    if (!commentInput.trim() || !item || !userIdentifier) return;

    try {
      await feedbackApi.addComment(item.id, commentInput, userIdentifier);
      setCommentInput("");
      await refetchComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleVote = () => {
    if (!item || !userIdentifier || hasVoted) return;
    addVoteMutation.mutate({ feedbackId: item.id, userId: userIdentifier });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (isLoadingItem) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="text-center text-muted-foreground">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={item.type === "feature" ? "default" : "destructive"}>
                {item.type === "feature" ? "Feature" : "Bug"}
              </Badge>
              <Badge variant={getStatusColor(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-foreground leading-relaxed">
                {item.summary}
              </p>
            </div>

            {item.details && (item.details.stepsToReproduce || item.details.expectedBehavior || item.details.actualBehavior) && (
              <div className="space-y-3 text-sm">
                {item.details.stepsToReproduce && (
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground mb-1">
                      STEPS TO REPRODUCE
                    </p>
                    <p className="text-foreground">{item.details.stepsToReproduce}</p>
                  </div>
                )}
                {item.details.expectedBehavior && (
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground mb-1">
                      EXPECTED BEHAVIOR
                    </p>
                    <p className="text-foreground">{item.details.expectedBehavior}</p>
                  </div>
                )}
                {item.details.actualBehavior && (
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground mb-1">
                      ACTUAL BEHAVIOR
                    </p>
                    <p className="text-foreground">{item.details.actualBehavior}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant={hasVoted ? "default" : "outline"}
                size="sm"
                onClick={handleVote}
                disabled={hasVoted}
                className="gap-1"
              >
                <ThumbsUp className="size-4" />
                {item.votes}
              </Button>

              {item.previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1"
                >
                  <a href={item.previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Preview
                  </a>
                </Button>
              )}

              {item.githubIssueUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1"
                >
                  <a href={item.githubIssueUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Comments</h3>

            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9"
                aria-label="Add a comment"
              />
              <Button
                onClick={handleAddComment}
                size="icon"
                variant="default"
                disabled={!commentInput.trim()}
                aria-label="Submit comment"
              >
                <ArrowUp className="size-4" />
              </Button>
            </div>

            <ScrollArea className="h-64 rounded-md border">
              <div className="flex flex-col p-4">
                {comments.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No comments yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="pb-4 border-b last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.userIdentifier}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
