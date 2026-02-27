import { describe, expect, it, vi, beforeEach } from "vitest";

import type { FeedbackItem } from "@/types/api";

// vi.hoisted ensures these variables are available when vi.mock factory runs (which is hoisted)
const { mockGetDocs, mockWhere, mockOrderBy, mockQuery, mockCollection } =
  vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
    mockWhere: vi.fn((...args: unknown[]) => args),
    mockOrderBy: vi.fn((...args: unknown[]) => args),
    mockQuery: vi.fn((...args: unknown[]) => args),
    mockCollection: vi.fn(() => "feedbackCollection"),
  }));

vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  doc: vi.fn(),
  getDocs: mockGetDocs,
  getDoc: vi.fn(),
  increment: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: mockOrderBy,
  query: mockQuery,
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: mockWhere,
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => vi.fn()),
  getFunctions: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
}));

vi.mock("./firebase", () => ({
  db: {},
  auth: {},
  functions: {},
}));

const makeDoc = (item: Partial<FeedbackItem> & { status: string }) => ({
  id: item.id ?? "doc-1",
  exists: () => true,
  data: () => ({
    title: item.title ?? "Default Title",
    summary: item.summary ?? "Default summary",
    type: item.type ?? "feature",
    status: item.status,
    votes: item.votes ?? 0,
    commentCount: item.commentCount ?? 0,
    updatedAt: { toDate: () => new Date(), toLocaleString: () => "" },
    createdAt: { toDate: () => new Date(), toISOString: () => "" },
  }),
});

describe("feedbackApi.searchDuplicates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns matching active-status items", async () => {
    const { feedbackApi } = await import("./feedbackApi");

    mockGetDocs.mockResolvedValue({
      docs: [
        makeDoc({ id: "1", title: "Dark mode support", summary: "Add dark mode", status: "new" }),
        makeDoc({ id: "2", title: "Dark theme toggle", summary: "Support dark mode", status: "planned" }),
      ],
    });

    const results = await feedbackApi.searchDuplicates("dark mode");

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("does not return items with closed status", async () => {
    const { feedbackApi } = await import("./feedbackApi");

    mockGetDocs.mockResolvedValue({
      docs: [
        makeDoc({ id: "1", title: "Dark mode toggle", summary: "Support dark mode", status: "new" }),
      ],
    });

    await feedbackApi.searchDuplicates("dark mode");

    // Verify the where() filter was called with only active statuses (not closed)
    expect(mockWhere).toHaveBeenCalledWith(
      "status",
      "in",
      ["new", "planned", "in-progress", "preview"]
    );
  });

  it("passes the active-status filter to the Firestore query", async () => {
    const { feedbackApi } = await import("./feedbackApi");

    mockGetDocs.mockResolvedValue({ docs: [] });

    await feedbackApi.searchDuplicates("some title");

    // Verify "closed" and "merged" are NOT in the status filter
    const whereCall = mockWhere.mock.calls[0];
    const statuses: string[] = whereCall[2] as string[];
    expect(statuses).not.toContain("closed");
    expect(statuses).not.toContain("merged");
    expect(statuses).not.toContain("wontfix");
    expect(statuses).not.toContain("duplicate");
  });

  it("respects the limit parameter", async () => {
    const { feedbackApi } = await import("./feedbackApi");

    mockGetDocs.mockResolvedValue({
      docs: Array.from({ length: 10 }, (_, i) =>
        makeDoc({ id: String(i), title: "dark mode feature", summary: "dark theme", status: "new" })
      ),
    });

    const results = await feedbackApi.searchDuplicates("dark mode", 3);

    expect(results).toHaveLength(3);
  });
});
