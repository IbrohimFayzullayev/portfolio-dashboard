import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  minutesSince,
  slugify,
  timeAgo,
  todayISO,
} from "@/lib/utils";

describe("cn", () => {
  it("merges and de-duplicates Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("a", false, "b")).toBe("a b");
  });
});

describe("formatDate", () => {
  it("formats a valid date in short form", () => {
    expect(formatDate("2026-06-08")).toBe("Jun 8, 2026");
  });

  it("returns an em dash for an invalid date", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("todayISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses repeated spaces and hyphens", () => {
    expect(slugify("  a   b--c ")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-edge-")).toBe("edge");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it("picks the coarsest unit that still says something", () => {
    expect(timeAgo(ago(20_000), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5 min ago");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("3 h ago");
    // Hours up to two days: "26 h ago" is the number the backup check uses.
    expect(timeAgo(ago(26 * 3_600_000), now)).toBe("26 h ago");
    expect(timeAgo(ago(5 * 86_400_000), now)).toBe("5 d ago");
  });

  it("does not go negative for a clock that is slightly ahead", () => {
    expect(timeAgo(ago(-30_000), now)).toBe("just now");
  });

  it("returns an em dash for an unparseable date", () => {
    expect(timeAgo("nope", now)).toBe("—");
  });
});

describe("minutesSince", () => {
  const now = new Date("2026-10-07T12:00:00Z");

  it("measures elapsed minutes", () => {
    expect(minutesSince("2026-10-07T11:45:00Z", now)).toBe(15);
  });

  it("treats an unparseable date as infinitely old, so staleness checks fail safe", () => {
    expect(minutesSince("nope", now)).toBe(Number.POSITIVE_INFINITY);
  });
});
