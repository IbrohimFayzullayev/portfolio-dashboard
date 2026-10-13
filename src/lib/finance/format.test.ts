import { describe, expect, it } from "vitest";

import {
  addDays,
  compactSom,
  daysBetween,
  formatAmounts,
  formatDay,
  formatMoney,
  parseAmountInput,
  amountInputValue,
  percentChange,
  periodFor,
} from "@/lib/finance/format";

const sp = (s: string) => s.replace(/ /g, " ");

describe("formatMoney", () => {
  it("formats so'm with grouped thousands and drops zero tiyin", () => {
    expect(sp(formatMoney(3_500_000))).toBe("35 000 so'm");
    expect(sp(formatMoney(125_000_000))).toBe("1 250 000 so'm");
    expect(sp(formatMoney(50_000))).toBe("500 so'm");
  });
  it("formats dollars with cents only when present", () => {
    expect(formatMoney(1_250, "USD")).toBe("$12.50");
    expect(sp(formatMoney(120_000, "USD"))).toBe("$1 200");
  });
  it("keeps the sign", () => {
    expect(sp(formatMoney(-30_000_000))).toBe("-300 000 so'm");
  });
  it("never breaks a number across lines", () => {
    expect(formatMoney(125_000_000)).not.toContain(" ");
  });
});

describe("formatAmounts", () => {
  it("joins currencies and handles empty", () => {
    expect(sp(formatAmounts({ UZS: 100_000_000, USD: 30_000 }))).toBe(
      "1 000 000 so'm + $300",
    );
    expect(sp(formatAmounts({}))).toBe("0 so'm");
    expect(sp(formatAmounts(undefined))).toBe("0 so'm");
  });
});

describe("compactSom", () => {
  it("shortens for axis labels", () => {
    expect(compactSom(35_000_000)).toBe("350k");
    expect(sp(compactSom(120_000_000))).toBe("1.2 mln");
    expect(sp(compactSom(1_500_000_000))).toBe("15 mln");
    expect(sp(compactSom(100_000_000))).toBe("1 mln");
  });
});

describe("parseAmountInput", () => {
  it.each([
    ["35000", 3_500_000],
    ["35 000", 3_500_000],
    ["35k", 3_500_000],
    ["1.5 mln", 150_000_000],
    ["1,5mln", 150_000_000],
    ["12.50", 1_250],
  ])("%s", (raw, minor) => {
    expect(parseAmountInput(raw)).toBe(minor);
  });
  it.each(["", "abc", "0", "-5", "1.2.3"])("rejects %j", (raw) => {
    expect(parseAmountInput(raw)).toBeNull();
  });
  it("round-trips through amountInputValue", () => {
    expect(parseAmountInput(amountInputValue(3_500_000))).toBe(3_500_000);
    expect(parseAmountInput(amountInputValue(1_250))).toBe(1_250);
  });
});

describe("dates", () => {
  it("does calendar arithmetic without time zones", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-10-01", "2026-10-13")).toBe(12);
  });
  it("formats days, adding the year only when it differs", () => {
    expect(formatDay("2026-10-05", 2026)).toBe("05.10");
    expect(formatDay("2025-10-05", 2026)).toBe("05.10.2025");
  });
});

describe("periodFor", () => {
  it("this month compares with the same days of last month", () => {
    const p = periodFor("month", "2026-10-13");
    expect([p.from, p.to, p.compareFrom, p.compareTo]).toEqual([
      "2026-10-01",
      "2026-10-13",
      "2026-09-01",
      "2026-09-13",
    ]);
  });
  it("clamps to a shorter previous month", () => {
    const p = periodFor("month", "2026-03-31");
    expect(p.compareTo).toBe("2026-02-28");
  });
  it("last month is the whole month, across a year boundary", () => {
    const p = periodFor("last-month", "2026-01-10");
    expect([p.from, p.to, p.compareFrom, p.compareTo]).toEqual([
      "2025-12-01",
      "2025-12-31",
      "2025-11-01",
      "2025-11-30",
    ]);
  });
  it("7 days ends today and compares with the 7 before", () => {
    const p = periodFor("7d", "2026-10-13");
    expect([p.from, p.to, p.compareFrom, p.compareTo]).toEqual([
      "2026-10-07",
      "2026-10-13",
      "2026-09-30",
      "2026-10-06",
    ]);
  });
});

describe("percentChange", () => {
  it("needs a baseline", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
    expect(percentChange(5, 0)).toBeNull();
  });
});
