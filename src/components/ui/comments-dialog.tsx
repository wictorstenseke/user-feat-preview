import * as React from "react";

import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  commentCount: number;
}

const PLACEHOLDER_COMMENTS = [
  {
    id: "c1",
    author: "Alice",
    text: "This would be a great addition to the product.",
    timestamp: "2 hours ago",
  },
  {
    id: "c2",
    author: "Bob",
    text: "I second this! Really looking forward to it.",
    timestamp: "1 hour ago",
  },
  {
    id: "c3",
    author: "Charlie",
    text: "Can this be prioritized? It would help a lot of users.",
    timestamp: "30 minutes ago",
  },
];

export const CommentsDialog = ({
  open,
  onOpenChange,
  itemTitle,
}: CommentsDialogProps) => {
  const [inputValue, setInputValue] = React.useState("");
  const [comments, setComments] = React.useState(PLACEHOLDER_COMMENTS);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    const newComment = {
      id: `c${Date.now()}`,
      author: "You",
      text: inputValue,
      timestamp: "just now",
    };

    setComments((prev) => [...prev, newComment]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">{itemTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Add a comment..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9"
              aria-label="Add a comment"
            />
            <Button
              onClick={handleSubmit}
              size="icon-sm"
              variant="default"
              disabled={!inputValue.trim()}
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
                          {comment.author}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.timestamp}
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
      </DialogContent>
    </Dialog>
  );
};
