import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { dayBars } from "./growth-overview";
import { recentBars } from "./books-overview";
import { Markdown } from "@/components/notes/notes-view";
import type { BooksSummary, GrowthSummary } from "@/lib/growth/types";

describe("dayBars", () => {
  it("plots minutes and ticks once a week, counted back from today", () => {
    const by_day = Array.from({ length: 15 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      minutes: i === 3 ? 45 : 0,
      by_kind: {},
    }));
    const bars = dayBars({
      to: "2026-10-15",
      by_day,
    } as unknown as GrowthSummary);
    expect(bars).toHaveLength(15);
    expect(bars[3]!.value).toBe(45);
    expect(bars.filter((b) => b.tick).map((b) => b.key)).toEqual([
      "2026-10-01",
      "2026-10-08",
      "2026-10-15",
    ]);
  });
});

describe("recentBars", () => {
  it("keeps every day, including the empty ones", () => {
    const recent = [
      { date: "2026-10-12", minutes: 0 },
      { date: "2026-10-13", minutes: 30 },
    ];
    const bars = recentBars({ recent } as unknown as BooksSummary);
    expect(bars.map((b) => b.value)).toEqual([0, 30]);
  });
});

describe("Markdown", () => {
  it("renders headings and GitHub tables", () => {
    render(
      <Markdown
        body={
          "# Reja\n\n| Sprint | Natija |\n|---|---|\n| 0 | Format |\n\n**qalin**"
        }
      />,
    );
    expect(screen.getByRole("heading", { name: "Reja" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
    expect(screen.getByText("qalin").tagName).toBe("STRONG");
  });
});
