import { describe, expect, it } from "vitest";

import { niceCeil } from "./bar-chart";
import { dailyBars } from "./overview";
import type { FinanceSummary } from "@/lib/finance/types";

describe("niceCeil", () => {
  it.each([
    [0, 1],
    [7, 10],
    [12, 20],
    [21, 25],
    [3_400_000, 5_000_000],
    [100, 100],
  ])("%d → %d", (v, want) => {
    expect(niceCeil(v)).toBe(want);
  });
});

describe("dailyBars", () => {
  it("labels the 1st and every 5th day of a month and plots so'm only", () => {
    const by_day = Array.from({ length: 13 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      amounts: i === 1 ? { UZS: 500, USD: 99 } : {},
    }));
    const bars = dailyBars(
      { by_day } as unknown as FinanceSummary,
      "2026-10-13",
    );
    expect(bars).toHaveLength(13);
    expect(bars[1]!.value).toBe(500);
    expect(bars.filter((b) => b.tick).map((b) => b.tick)).toEqual([
      "1",
      "5",
      "10",
    ]);
  });
});
