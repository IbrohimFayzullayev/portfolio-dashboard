"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useFinanceMeta, useFinanceSummary } from "@/lib/finance/hooks";
import {
  PRESETS,
  compactSom,
  customPeriod,
  formatDay,
  formatMoney,
  formatMonth,
  formatMonthShort,
  localToday,
  periodFor,
  type Period,
  type PresetKey,
} from "@/lib/finance/format";
import type { FinanceSummary } from "@/lib/finance/types";
import { BarChart, type Bar } from "./bar-chart";
import {
  CategoryBars,
  DebtsList,
  GiftsList,
  Section,
  StatTiles,
} from "./parts";
import { EntriesList, emptyFilter, type EntriesFilterState } from "./entries";

/**
 * The money page. One component for both places it appears: the dashboard
 * (/finance, editable) and the Telegram Mini App (/tg, read-only). What
 * differs between them comes from FinanceSource, never from a prop here, so
 * adding a section to one adds it to the other.
 */
export function FinanceOverview({
  allowCustomRange = true,
}: {
  allowCustomRange?: boolean;
}) {
  const meta = useFinanceMeta();
  const today = meta.data?.today ?? localToday();

  const [preset, setPreset] = React.useState<PresetKey | "custom">("month");
  const [custom, setCustom] = React.useState<{
    from: string;
    to: string;
  } | null>(null);
  const [filter, setFilter] = React.useState<EntriesFilterState>(emptyFilter);

  const period: Period =
    preset === "custom" && custom
      ? customPeriod(custom.from, custom.to)
      : periodFor(preset === "custom" ? "month" : preset, today);

  const summary = useFinanceSummary(
    meta.data
      ? {
          from: period.from,
          to: period.to,
          compareFrom: period.compareFrom,
          compareTo: period.compareTo,
        }
      : null,
  );

  const categories = React.useMemo(
    () => new Map((meta.data?.categories ?? []).map((c) => [c.key, c])),
    [meta.data],
  );

  const entriesRef = React.useRef<HTMLDivElement>(null);
  const showEntries = (next: EntriesFilterState) => {
    setFilter(next);
    entriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (meta.isLoading || (summary.isLoading && !summary.data)) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }
  const failure = meta.error ?? summary.error;
  if (failure || !meta.data || !summary.data) {
    return (
      <p className="text-destructive text-sm">
        {failure instanceof ApiError
          ? failure.message
          : "Ma'lumotni yuklab bo'lmadi"}
      </p>
    );
  }

  const s = summary.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="bg-muted flex flex-wrap gap-1 rounded-lg p-1"
          role="group"
          aria-label="Davr"
        >
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              aria-pressed={preset === p.key}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                preset === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {allowCustomRange && (
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              aria-label="Boshlanish"
              className="h-9 w-[9.5rem]"
              value={custom?.from ?? period.from}
              max={today}
              onChange={(e) => {
                const from = e.target.value;
                if (!from) return;
                setCustom({
                  from,
                  to: custom?.to && custom.to >= from ? custom.to : period.to,
                });
                setPreset("custom");
              }}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="date"
              aria-label="Tugash"
              className="h-9 w-[9.5rem]"
              value={custom?.to ?? period.to}
              max={today}
              onChange={(e) => {
                const to = e.target.value;
                if (!to) return;
                setCustom({
                  from:
                    custom?.from && custom.from <= to
                      ? custom.from
                      : period.from,
                  to,
                });
                setPreset("custom");
              }}
            />
          </div>
        )}
        {summary.isFetching && (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}
      </div>

      <h2 className="text-muted-foreground text-sm">{period.label}</h2>

      <StatTiles summary={s} compareLabel={period.compareLabel} />

      <Section title="Kunlik sarf">
        <BarChart
          bars={dailyBars(s, today)}
          formatValue={(v) => formatMoney(v)}
          formatAxis={compactSom}
          idleText={peakText(s)}
          ariaLabel={`Kunlik sarf, ${period.label}`}
        />
        {Boolean(s.spent.USD) && (
          <p className="text-muted-foreground mt-2 text-xs">
            Grafik faqat so&apos;mda. Dollarda:{" "}
            {formatMoney(s.spent.USD ?? 0, "USD")}
          </p>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Kategoriyalar">
          <CategoryBars
            summary={s}
            categories={categories}
            selected={filter.category || undefined}
            onSelect={(key) => showEntries({ ...filter, category: key ?? "" })}
          />
        </Section>
        <div className="space-y-4">
          <Section title="Qarzlar (hozirgi holat)">
            <DebtsList
              debts={s.debts}
              today={today}
              onSelectPerson={(person) =>
                showEntries({ ...emptyFilter, person })
              }
            />
          </Section>
          <Section title="Kimga berildi">
            <GiftsList
              summary={s}
              onSelectPerson={(person) =>
                showEntries({ ...emptyFilter, person })
              }
            />
          </Section>
        </div>
      </div>

      <Section title="Oxirgi 12 oy">
        <BarChart
          bars={s.by_month.map((m) => ({
            key: m.month,
            value: m.amounts.UZS ?? 0,
            label: formatMonth(m.month),
            tick: formatMonthShort(m.month),
          }))}
          formatValue={(v) => formatMoney(v)}
          formatAxis={compactSom}
          idleText="Har oy qancha sarflangani"
          height={150}
          ariaLabel="Oylik sarf, oxirgi 12 oy"
        />
      </Section>

      <div ref={entriesRef} className="scroll-mt-4">
        <Section title="Yozuvlar">
          <EntriesList
            from={period.from}
            to={period.to}
            kinds={meta.data.kinds}
            categories={meta.data.categories}
            filter={filter}
            onFilterChange={setFilter}
            today={today}
          />
        </Section>
      </div>
    </div>
  );
}

/** Day bars with a tick on the 1st, every 5th day, and the last day. */
export function dailyBars(s: FinanceSummary, today: string): Bar[] {
  const thisYear = Number(today.slice(0, 4));
  const n = s.by_day.length;
  const every = n <= 10 ? 1 : n <= 45 ? 5 : n <= 120 ? 14 : 30;
  return s.by_day.map((d, i) => {
    const day = Number(d.date.slice(8, 10));
    const showTick =
      n <= 10 || i === 0 || (n <= 45 ? day % every === 0 : i % every === 0);
    return {
      key: d.date,
      value: d.amounts.UZS ?? 0,
      label: formatDay(d.date, thisYear),
      tick: showTick ? (n <= 45 ? String(day) : formatDay(d.date)) : "",
    };
  });
}

function peakText(s: FinanceSummary): string {
  let peak = s.by_day[0];
  for (const d of s.by_day) {
    if ((d.amounts.UZS ?? 0) > (peak?.amounts.UZS ?? 0)) peak = d;
  }
  if (!peak || !peak.amounts.UZS) return "Bu davrda xarajat yo'q";
  return `Eng ko'p: ${formatDay(peak.date)} · ${formatMoney(peak.amounts.UZS)}`;
}
