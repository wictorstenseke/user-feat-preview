import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import {
  RootErrorComponent,
  RootNotFoundComponent,
  RootRouteComponent,
} from "@/routes/__root";

const HomePage = () => {
  return <h1>Home page</h1>;
};

const BrokenPage = () => {
  throw new Error("Route render failed");
};

const renderWithTestRouter = (initialEntries: string[]) => {
  const rootRoute = createRootRoute({
    component: RootRouteComponent,
    errorComponent: RootErrorComponent,
    notFoundComponent: RootNotFoundComponent,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
  });

  const brokenRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/broken",
    component: BrokenPage,
  });

  const routeTree = rootRoute.addChildren([indexRoute, brokenRoute]);
  const history = createMemoryHistory({ initialEntries });

  const router = createRouter({
    routeTree,
    history,
  });

  render(<RouterProvider router={router} />);
  return { router };
};

describe("root route resilience", () => {
  it("renders not found UI for unknown routes and navigates home", async () => {
    const user = userEvent.setup();
    renderWithTestRouter(["/missing-route"]);

    expect(
      await screen.findByRole("heading", { name: /page not found/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /go to home/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /home page/i })).toBeInTheDocument();
    });
  });

  it("renders error boundary UI when a route throws and supports recovery", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    renderWithTestRouter(["/broken"]);

    expect(
      await screen.findByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/route render failed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /go to home/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /home page/i })).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});
