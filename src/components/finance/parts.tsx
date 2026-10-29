"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatAmounts,
  formatDay,
  formatMoney,
  formatSignedAmounts,
  percentChange,
  daysBetween,
  savingsRate,
} from "@/lib/finance/format";
import type {
  Amounts,
  FinanceCategory,
  FinanceDebts,
  FinanceSummary,
} from "@/lib/finance/types";

/* Small building blocks of the money page. Everything here is presentational:
 * data in, markup out. */

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card rounded-xl border p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Tile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card rounded-xl border p-4 shadow-sm", className)}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {/* A step smaller on phones: "11 000 000 so'm" is one unbreakable word
          and at text-lg it no longer fits half of a 390px screen, so it
          broke inside "so'm". */}
      <p className="mt-1 text-base font-semibold tracking-tight break-words tabular-nums min-[400px]:text-lg sm:text-2xl">
        {value}
      </p>
      {hint && <div className="text-muted-foreground mt-1 text-xs">{hint}</div>}
    </div>
  );
}

/**
 * Change against the comparison window. Spending more is not "bad" in a
 * colour-coded way here: it is a fact, shown with an arrow and a number.
 */
function Delta({
  current,
  previous,
  label,
}: {
  current: number;
  previous: number;
  label?: string;
}) {
  const pct = percentChange(current, previous);
  if (pct === null)
    return <span>{label ? `${label}: ma'lumot yo'q` : null}</span>;
  const Icon = pct >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Icon className="size-3.5" aria-hidden />
      <span className="text-foreground font-medium">
        {pct > 0 ? "+" : ""}
        {pct}%
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

export function StatTiles({
  summary,
  compareLabel,
}: {
  summary: FinanceSummary;
  compareLabel?: string;
}) {
  const spentUZS = summary.spent.UZS ?? 0;
  const avg: Amounts = {};
  for (const [cur, v] of Object.entries(summary.spent) as [
    keyof Amounts,
    number,
  ][]) {
    // Whole so'm: "202 307.69 so'm a day" is precision nobody asked for.
    const perDay = v / Math.max(1, summary.days);
    avg[cur] =
      cur === "UZS" ? Math.round(perDay / 100) * 100 : Math.round(perDay);
  }
  const expenses = summary.by_kind.expense?.count ?? 0;
  const gifts = summary.by_kind.gift?.count ?? 0;
  const incomes = summary.by_kind.income?.count ?? 0;
  const rate = savingsRate(summary.income, summary.net);
  const hasIncome = Object.values(summary.income).some(Boolean);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label="Kirim"
        value={formatAmounts(summary.income)}
        hint={hasIncome ? `${incomes} marta` : "Botda: +10mln oylik"}
      />
      <Tile
        label="Sarflandi"
        value={formatAmounts(summary.spent)}
        hint={
          summary.compare ? (
            <Delta
              current={spentUZS}
              previous={summary.compare.spent.UZS ?? 0}
              label={compareLabel}
            />
          ) : (
            `${expenses + gifts} ta yozuv`
          )
        }
      />
      <Tile
        label="Qoldi (kirim - sarf)"
        value={hasIncome ? formatSignedAmounts(summary.net) : "-"}
        hint={
          rate === null ? "Kirim yozilmagan" : `Kirimning ${rate}% i saqlandi`
        }
      />
      <Tile
        label="Kuniga o'rtacha sarf"
        value={formatAmounts(avg)}
        hint={`${summary.days} kun · ${expenses + gifts} ta yozuv`}
      />
    </div>
  );
}

export function CategoryBars({
  summary,
  categories,
  selected,
  onSelect,
}: {
  summary: FinanceSummary;
  categories: Map<string, FinanceCategory>;
  selected?: string;
  onSelect?: (key: string | undefined) => void;
}) {
  const rows = summary.by_category;
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Bu davrda xarajat yo&apos;q.
      </p>
    );
  }
  const total = summary.spent.UZS ?? 0;
  const max = Math.max(1, ...rows.map((r) => r.amounts.UZS ?? 0));

  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const c = categories.get(r.category);
        const uzs = r.amounts.UZS ?? 0;
        const isSelected = selected === r.category;
        return (
          <li key={r.category}>
            <button
              type="button"
              onClick={() => onSelect?.(isSelected ? undefined : r.category)}
              aria-pressed={isSelected}
              className={cn(
                "hover:bg-accent w-full rounded-md px-2 py-1.5 text-left transition-colors",
                isSelected && "bg-secondary",
              )}
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">
                  <span aria-hidden>{c?.emoji ?? "📦"} </span>
                  {c?.label ?? r.category}
                  <span className="text-muted-foreground"> · {r.count}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatAmounts(r.amounts)}
                  {total > 0 && uzs > 0 && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {Math.round((uzs / total) * 100)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-foreground h-full rounded-full"
                  style={{ width: `${(uzs / max) * 100}%` }}
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function DebtsList({
  debts,
  today,
  onSelectPerson,
}: {
  debts: FinanceDebts;
  today: string;
  onSelectPerson?: (person: string) => void;
}) {
  if (debts.balances.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Ochiq qarz yo&apos;q.</p>
    );
  }

  const groups = [
    {
      title: "Sizga qarzdor",
      total: debts.owed_to_me,
      rows: debts.balances.filter((b) => b.amount_minor > 0),
    },
    {
      title: "Siz qarzdorsiz",
      total: debts.i_owe,
      rows: debts.balances.filter((b) => b.amount_minor < 0),
    },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="text-muted-foreground mb-1 flex justify-between text-xs font-medium">
            <span>{g.title}</span>
            <span className="tabular-nums">{formatAmounts(g.total)}</span>
          </p>
          <ul className="divide-y">
            {g.rows.map((b) => {
              const days = daysBetween(b.since, today);
              return (
                <li key={`${b.person}-${b.currency}`}>
                  <button
                    type="button"
                    onClick={() => onSelectPerson?.(b.person)}
                    className="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {b.person}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDay(b.since)} dan ·{" "}
                        {days <= 0 ? "bugun" : `${days} kun`}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatMoney(Math.abs(b.amount_minor), b.currency)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function GiftsList({
  summary,
  onSelectPerson,
}: {
  summary: FinanceSummary;
  onSelectPerson?: (person: string) => void;
}) {
  if (summary.gifts_by_person.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Bu davrda hech kimga berilmagan.
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {summary.gifts_by_person.map((g) => (
        <li key={g.person || "-"}>
          <button
            type="button"
            disabled={!g.person}
            onClick={() => g.person && onSelectPerson?.(g.person)}
            className="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm disabled:hover:bg-transparent"
          >
            <span className="truncate">
              {g.person || (
                <span className="text-muted-foreground">Ismsiz</span>
              )}
              {g.count > 1 && (
                <span className="text-muted-foreground">
                  {" "}
                  · {g.count} marta
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatAmounts(g.amounts)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
