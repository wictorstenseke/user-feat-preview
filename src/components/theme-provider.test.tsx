import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModeToggle } from "@/components/mode-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider, useTheme } from "./theme-provider";

const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

const ThemeStateProbe = () => {
  const { mode, resolvedMode } = useTheme();

  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved-mode">{resolvedMode}</span>
    </div>
  );
};

const setupMatchMedia = (initiallyDark: boolean) => {
  let matches = initiallyDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: (
          eventName: string,
          listener: (event: MediaQueryListEvent) => void
        ) => {
          if (eventName === "change") {
            listeners.add(listener);
          }
        },
        removeEventListener: (
          eventName: string,
          listener: (event: MediaQueryListEvent) => void
        ) => {
          if (eventName === "change") {
            listeners.delete(listener);
          }
        },
        dispatchEvent: () => true,
      };
    }),
  });

  return {
    setMatches: (nextValue: boolean) => {
      matches = nextValue;
      const event = {
        matches: nextValue,
        media: SYSTEM_THEME_QUERY,
      } as MediaQueryListEvent;

      listeners.forEach((listener) => {
        listener(event);
      });
    },
  };
};

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
  vi.restoreAllMocks();
});

describe("ThemeProvider", () => {
  it("resolves system mode from matchMedia", async () => {
    setupMatchMedia(true);

    render(
      <ThemeProvider defaultMode="system">
        <ThemeStateProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("mode")).toHaveTextContent("system");
      expect(screen.getByTestId("resolved-mode")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("updates resolved mode and classes when system preference changes", async () => {
    const mediaController = setupMatchMedia(true);

    render(
      <ThemeProvider defaultMode="system">
        <ThemeStateProbe />
      </ThemeProvider>
    );

    act(() => {
      mediaController.setMatches(false);
    });

    await waitFor(() => {
      expect(screen.getByTestId("resolved-mode")).toHaveTextContent("light");
      expect(document.documentElement).toHaveClass("light");
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });

  it("falls back to light mode when matchMedia is unavailable", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    render(
      <ThemeProvider defaultMode="system">
        <ThemeStateProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("resolved-mode")).toHaveTextContent("light");
      expect(document.documentElement).toHaveClass("light");
    });
  });

  it("toggles using resolved mode when mode starts as system", async () => {
    setupMatchMedia(true);
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultMode="system">
        <TooltipProvider>
          <ModeToggle />
        </TooltipProvider>
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole("button", {
      name: /switch to light mode/i,
    });

    await user.click(toggleButton);

    await waitFor(() => {
      expect(toggleButton).toHaveAttribute("aria-label", "Switch to dark mode");
      expect(window.localStorage.getItem("vite-ui-theme-mode")).toBe("light");
      expect(document.documentElement).toHaveClass("light");
    });
  });
});
