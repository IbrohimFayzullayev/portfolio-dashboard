import { describe, expect, it } from "vitest";

import { axisMinutes, formatMinutes, parseTab, sprintDay } from "./format";

describe("formatMinutes", () => {
  it.each([
    [5, "5 daq"],
    [60, "1 s"],
    [80, "1 s 20 daq"],
  ])("%d → %s", (m, want) => expect(formatMinutes(m)).toBe(want));
  it("axis", () => {
    expect(axisMinutes(30)).toBe("30");
    expect(axisMinutes(90)).toBe("1.5 s");
    expect(axisMinutes(120)).toBe("2 s");
  });
});

describe("sprintDay", () => {
  // 19 Oct 2026 is a Monday, 24 a Saturday, 25 a Sunday.
  it("counts working days only", () => {
    expect(sprintDay("2026-10-19", "2026-10-24", "2026-10-18")).toEqual({
      n: 0,
      total: 6,
    });
    expect(sprintDay("2026-10-19", "2026-10-24", "2026-10-21")).toEqual({
      n: 3,
      total: 6,
    });
    expect(sprintDay("2026-10-19", "2026-10-24", "2026-10-30")).toEqual({
      n: 6,
      total: 6,
    });
  });
});

describe("parseTab", () => {
  it("reads the deep link the bot builds", () => {
    expect(parseTab("?doc=reja&tab=notes")).toEqual({
      tab: "notes",
      doc: "reja",
    });
    expect(parseTab("?tab=growth")).toEqual({ tab: "growth", doc: "" });
  });
  it("falls back to money and drops a doc that is not a slug", () => {
    expect(parseTab("")).toEqual({ tab: "money", doc: "" });
    expect(parseTab("?tab=admin&doc=../../etc")).toEqual({
      tab: "money",
      doc: "",
    });
  });
});
