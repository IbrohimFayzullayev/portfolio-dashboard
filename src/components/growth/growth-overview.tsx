"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { addDays, formatDay, localToday } from "@/lib/finance/format";
import {
  KIND_LABEL,
  KIND_ORDER,
  OUTCOME,
  axisMinutes,
  formatBand,
  formatMinutes,
  sprintDay,
} from "@/lib/growth/format";
import { useGrowthSummary } from "@/lib/growth/hooks";
import type {
  GrowthKind,
  GrowthScore,
  GrowthSprint,
  GrowthSummary,
} from "@/lib/growth/types";
import { BarChart, type Bar } from "@/components/finance/bar-chart";
import { LineChart } from "@/components/finance/charts";
import { Section } from "@/components/finance/parts";

/**
 * English practice, organised the way it is done: in sprints. There is no
 * streak and no daily target anywhere on this page on purpose — the open
 * sprint's one sentence is the target, and the history shows whether each
 * sprint's sentence came true. Minutes and active days are context, not score.
 */

const RANGES = [
  { key: "28", label: "4 hafta", days: 28 },
  { key: "91", label: "3 oy", days: 91 },
] as const;

export function GrowthOverview() {
  const [rangeKey, setRangeKey] = React.useState<"28" | "91">("28");
  const today = localToday();
  const days = RANGES.find((r) => r.key === rangeKey)!.days;
  const summary = useGrowthSummary(
    rangeKey === "28" ? null : { from: addDays(today, -(days - 1)), to: today },
  );

  if (summary.isLoading && !summary.data) return <Loading />;
  if (summary.error || !summary.data) {
    return <Failure error={summary.error} />;
  }
  const s = summary.data;
  const open = s.sprints.find((sp) => sp.open) ?? null;
  const history = s.sprints.filter((sp) => !sp.open);

  return (
    <div className="space-y-4">
      <OpenSprint sprint={open} today={s.to} />

      <Section
        title="Kunlik ingliz"
        action={
          <Segmented
            value={rangeKey}
            options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
            onChange={(v) => setRangeKey(v as "28" | "91")}
          />
        }
      >
        <BarChart
          bars={dayBars(s)}
          formatValue={(v) => (v ? formatMinutes(v) : "yozilmagan")}
          formatAxis={axisMinutes}
          idleText={`${formatMinutes(s.minutes)} · ${s.active_days}/${s.working_days} kun · 🎙 ${s.recordings}`}
          ariaLabel="Kunlik ingliz tili daqiqalari"
        />
        <KindBars byKind={s.by_kind} className="mt-4" />
      </Section>

      <Section title="Sprintlar">
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Yopilgan sprint hali yo&apos;q. Shanba kuni botda /yakun.
          </p>
        ) : (
          <SprintHistory sprints={history} />
        )}
      </Section>

      <Section title="IELTS ballari">
        <Scores scores={s.scores} />
      </Section>
    </div>
  );
}

/* ---------------------------------- parts --------------------------------- */

export function dayBars(s: GrowthSummary): Bar[] {
  const thisYear = Number(s.to.slice(0, 4));
  return s.by_day.map((d, i) => ({
    key: d.date,
    value: d.minutes,
    label: formatDay(d.date, thisYear),
    // A tick a week, counted back from today so the last bar is always labelled.
    tick: (s.by_day.length - 1 - i) % 7 === 0 ? formatDay(d.date) : "",
  }));
}

function OpenSprint({
  sprint,
  today,
}: {
  sprint: GrowthSprint | null;
  today: string;
}) {
  if (!sprint) {
    return (
      <Section title="Sprint">
        <p className="text-sm">Ochiq sprint yo&apos;q.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Botda natijani bitta jumlada yozing:{" "}
          <code className="bg-muted rounded px-1">
            /sprint 5 ta Task 2 essay
          </code>
        </p>
      </Section>
    );
  }
  const { n, total } = sprintDay(sprint.starts_on, sprint.ends_on, today);
  const resultDay = today >= sprint.ends_on;
  return (
    <section className="bg-card rounded-xl border p-4 shadow-sm sm:p-5">
      <p className="text-muted-foreground text-xs font-medium">
        🎯 Ochiq sprint · {formatDay(sprint.starts_on)} –{" "}
        {formatDay(sprint.ends_on)}
      </p>
      <p className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
        {sprint.goal}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Kun" value={n === 0 ? "boshlanmagan" : `${n}/${total}`} />
        <Stat
          label="Ishlangan kunlar"
          value={`${sprint.active_days}/${sprint.working_days}`}
        />
        <Stat label="Vaqt" value={formatMinutes(sprint.minutes)} />
      </div>
      <KindBars byKind={sprint.by_kind} className="mt-3" compact />
      <p className="text-muted-foreground mt-3 text-xs">
        🎙 {sprint.recordings} ta ovozli yozuv
        {resultDay && " · Bugun natija kuni — botda /yakun"}
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/60 rounded-lg px-3 py-2">
      <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
      <p className="text-sm font-semibold tabular-nums sm:text-base">{value}</p>
    </div>
  );
}

function KindBars({
  byKind,
  className,
  compact = false,
}: {
  byKind: Partial<Record<GrowthKind, number>>;
  className?: string;
  compact?: boolean;
}) {
  const rows = KIND_ORDER.filter((k) => (byKind[k] ?? 0) > 0).map((k) => ({
    kind: k,
    minutes: byKind[k] ?? 0,
  }));
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.minutes));
  return (
    <ul className={cn("space-y-1.5", className)}>
      {rows.map((r) => (
        <li
          key={r.kind}
          className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-sm"
        >
          <span className="text-muted-foreground truncate">
            {KIND_LABEL[r.kind]}
          </span>
          <span className="bg-muted h-2 overflow-hidden rounded-full">
            <span
              className="bg-foreground block h-full rounded-full"
              style={{ width: `${Math.max(3, (r.minutes / max) * 100)}%` }}
            />
          </span>
          <span
            className={cn(
              "tabular-nums",
              compact ? "text-xs" : "text-sm font-medium",
            )}
          >
            {formatMinutes(r.minutes)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SprintHistory({ sprints }: { sprints: GrowthSprint[] }) {
  const counts = { done: 0, partial: 0, missed: 0 };
  for (const sp of sprints) if (sp.outcome) counts[sp.outcome]++;
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {OUTCOME.done.icon} {counts.done} · {OUTCOME.partial.icon}{" "}
        {counts.partial} · {OUTCOME.missed.icon} {counts.missed}
      </p>
      <ul className="divide-y">
        {sprints.map((sp) => (
          <li key={sp.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="pt-0.5 text-base" aria-hidden>
              {sp.outcome ? OUTCOME[sp.outcome].icon : "·"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{sp.goal}</p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {formatDay(sp.starts_on)} – {formatDay(sp.ends_on)} ·{" "}
                {sp.outcome ? OUTCOME[sp.outcome].label : "javob berilmagan"} ·{" "}
                {formatMinutes(sp.minutes)} · {sp.active_days}/{sp.working_days}{" "}
                kun · 🎙 {sp.recordings}
              </p>
              {sp.result_note && (
                <p className="text-muted-foreground mt-0.5 text-xs italic">
                  {sp.result_note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SCORE_KIND: Record<GrowthScore["kind"], string> = {
  mock: "mock",
  official: "rasmiy",
  tutor: "repetitor",
};

function Scores({ scores }: { scores: GrowthScore[] }) {
  if (scores.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Ball hali yo&apos;q. Mock&apos;dan keyin botda:{" "}
        <code className="bg-muted rounded px-1">/ball 6.0 L6.5 W5.5</code>
      </p>
    );
  }
  const latest = scores[scores.length - 1]!;
  return (
    <div className="space-y-4">
      {scores.length > 1 && (
        <LineChart
          points={scores.map((sc, i) => ({
            key: `${sc.taken_on}-${i}`,
            value: sc.overall,
            label: `${formatDay(sc.taken_on)} · ${SCORE_KIND[sc.kind]}`,
            tick: formatDay(sc.taken_on),
          }))}
          formatValue={(v) => formatBand(v)}
          formatAxis={(v) => v.toFixed(1)}
          idleText={`Oxirgisi: ${formatBand(latest.overall)}`}
          ariaLabel="IELTS ballari"
          height={150}
        />
      )}
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-muted-foreground text-xs">
            <tr className="text-left">
              <th className="px-1 py-1 font-medium">Sana</th>
              <th className="px-1 py-1 font-medium">Umumiy</th>
              <th className="px-1 py-1 font-medium">L</th>
              <th className="px-1 py-1 font-medium">R</th>
              <th className="px-1 py-1 font-medium">W</th>
              <th className="px-1 py-1 font-medium">S</th>
            </tr>
          </thead>
          <tbody>
            {[...scores].reverse().map((sc, i) => (
              <tr key={`${sc.taken_on}-${i}`} className="border-t">
                <td className="px-1 py-1.5">
                  {formatDay(sc.taken_on)}{" "}
                  <span className="text-muted-foreground text-xs">
                    {SCORE_KIND[sc.kind]}
                  </span>
                </td>
                <td className="px-1 py-1.5 font-semibold">
                  {formatBand(sc.overall)}
                </td>
                <td className="px-1 py-1.5">{formatBand(sc.listening)}</td>
                <td className="px-1 py-1.5">{formatBand(sc.reading)}</td>
                <td className="px-1 py-1.5">{formatBand(sc.writing)}</td>
                <td className="px-1 py-1.5">{formatBand(sc.speaking)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --------------------------------- shared --------------------------------- */

export function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-muted flex gap-1 rounded-lg p-1" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex min-h-60 items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}

export function Failure({ error }: { error: unknown }) {
  return (
    <p className="text-destructive text-sm">
      {error instanceof ApiError ? error.message : "Ma'lumotni yuklab bo'lmadi"}
    </p>
  );
}
