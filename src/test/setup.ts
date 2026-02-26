import "@testing-library/jest-dom/vitest";

// Add custom matchers from jest-dom
// This extends Vitest's expect with matchers like toBeInTheDocument, toHaveClass, etc.

// ResizeObserver is not available in jsdom; stub it for components that use it (e.g. use-stick-to-bottom)
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver =
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
