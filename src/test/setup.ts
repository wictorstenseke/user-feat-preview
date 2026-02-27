import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Firebase to avoid "Component auth has not been registered yet" in tests
// (firebase.ts calls getAuth at module load; auth is not initialized in Node/jsdom)
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
  functions: {},
}));

// Mock firestore/functions so feedbackApi doesn't fail when components use it
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  increment: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  orderBy: vi.fn((...args: unknown[]) => args),
  query: vi.fn((...args: unknown[]) => args),
  setDoc: vi.fn(),
  where: vi.fn((...args: unknown[]) => args),
}));
vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })),
  getFunctions: vi.fn(),
}));

// Add custom matchers from jest-dom
// This extends Vitest's expect with matchers like toBeInTheDocument, toHaveClass, etc.

// ResizeObserver is not available in jsdom; stub it for components that use it (e.g. use-stick-to-bottom)
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver =
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
