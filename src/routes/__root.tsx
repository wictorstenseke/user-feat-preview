import type { ReactNode } from "react";

import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

interface RootContainerProps {
  children: ReactNode;
}

const RootContainer = ({ children }: RootContainerProps) => {
  return (
    <ThemeProvider defaultMode="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AppShell>{children}</AppShell>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export const RootRouteComponent = () => {
  return (
    <RootContainer>
      <Outlet />
    </RootContainer>
  );
};

export const RootErrorComponent = ({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) => {
  const handleRetry = () => {
    reset();
  };

  return (
    <RootContainer>
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            The page failed to load. You can retry or go back to the home page.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
          {error.message}
        </pre>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRetry}>Try again</Button>
          <Button variant="outline" asChild>
            <Link to="/">Go to home</Link>
          </Button>
        </div>
      </section>
    </RootContainer>
  );
};

export const RootNotFoundComponent = () => {
  return (
    <RootContainer>
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you requested does not exist or may have moved.
        </p>
        <div>
          <Button asChild>
            <Link to="/">Go to home</Link>
          </Button>
        </div>
      </section>
    </RootContainer>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const Route = createRootRoute({
  component: RootRouteComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});
