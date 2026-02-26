import { useState } from "react";

import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";

export function Landing() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (isLoading) {
      // Stop generation (TODO: cancel in-flight request when wired to API)
      setIsLoading(false);
      return;
    }
    if (!input.trim()) return;

    setIsLoading(true);
    // TODO: wire to AI/API when backend is ready
    console.log("Submitted:", input);
    setTimeout(() => {
      setIsLoading(false);
      setInput("");
    }, 2000);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-3xl flex-col justify-center py-12">
      <div className="mb-8 text-center">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight md:text-3xl">
          How can I help?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ask anything—I&apos;m here to assist.
        </p>
      </div>

      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        className="mx-auto w-full"
      >
        <PromptInputTextarea placeholder="Ask me anything..." />
        <PromptInputActions className="justify-end pt-2">
          <PromptInputAction
            tooltip={isLoading ? "Stop generation" : "Send message"}
          >
            <Button
              type="button"
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
              aria-label={isLoading ? "Stop generation" : "Send message"}
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
    </div>
  );
}
