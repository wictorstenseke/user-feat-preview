import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

import { cn, formatRelativeDate } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    const result = cn("base-class", isHidden && "hidden", "visible");
    expect(result).toBe("base-class visible");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });
});

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "today" for a date on the same day', () => {
    expect(formatRelativeDate("2025-03-01T08:00:00.000Z")).toBe("today");
  });

  it('returns "Xd ago" for dates within the past week', () => {
    expect(formatRelativeDate("2025-02-27T12:00:00.000Z")).toBe("2d ago");
    expect(formatRelativeDate("2025-02-23T12:00:00.000Z")).toBe("6d ago");
  });

  it('returns "Xw ago" for dates within the past month', () => {
    expect(formatRelativeDate("2025-02-08T12:00:00.000Z")).toBe("3w ago");
  });

  it('returns "Xmo ago" for dates within the past year', () => {
    expect(formatRelativeDate("2025-02-01T12:00:00.000Z")).toBe("1mo ago");
  });

  it('returns "Xy ago" for dates more than a year ago', () => {
    expect(formatRelativeDate("2023-03-01T12:00:00.000Z")).toBe("2y ago");
  });

  it("returns the original string for invalid dates", () => {
    expect(formatRelativeDate("not-a-date")).toBe("not-a-date");
  });
});
