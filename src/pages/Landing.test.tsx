import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { renderWithQueryClient } from "@/test/utils";

import { Landing } from "./Landing";

describe("Landing", () => {
  it("renders the main hero section", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("heading", {
        name: /build faster with a focused react starter/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/one landing page, strong defaults/i)
    ).toBeInTheDocument();
  });

  it("renders the primary actions", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("link", { name: /see stack benefits/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view on github/i })
    ).toBeInTheDocument();
  });

  it("renders all stack benefit cards", () => {
    renderWithQueryClient(<Landing />);

    const expectedBenefitTitles = [
      "Vite + Rolldown",
      "React 19 + TypeScript",
      "TanStack Router",
      "TanStack Query",
      "Tailwind CSS v4",
      "shadcn/ui + Radix",
      "Vitest + Testing Library",
      "ESLint + Prettier",
      "GitHub Actions CI",
    ];

    expectedBenefitTitles.forEach((title) => {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    });
  });
});
