import { describe, it, expect } from "vitest";
import { cn, formatDate, todayISO, slugify } from "@/lib/utils";

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
