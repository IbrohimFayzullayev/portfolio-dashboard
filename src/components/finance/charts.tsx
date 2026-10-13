"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { niceCeil, useWidth } from "./bar-chart";

const GUTTER_LEFT = 48;
const GUTTER_BOTTOM = 22;
const GUTTER_TOP = 8;

/* ------------------------------- line chart ------------------------------- */

export interface LinePoint {
  key: string;
  /** null: no value that day (before the first checkpoint). */
  value: number | null;
  label: string;
  tick: string;
}

/**
 * One line: the balance through the period. The y-axis does not start at
 * zero on purpose: a balance moving between 24 and 26 mln is the story, and
 * a zero baseline would flatten it into a straight line.
 */
export function LineChart({
  points,
  formatValue,
  formatAxis,
  idleText,
  ariaLabel,
  height = 170,
}: {
  points: LinePoint[];
  formatValue: (v: number) => string;
  formatAxis: (v: number) => string;
  idleText?: string;
  ariaLabel: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);

  const known = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null);
  let lo = Math.min(...known);
  let hi = Math.max(...known);
  if (!known.length) [lo, hi] = [0, 1];
  if (lo === hi)
    [lo, hi] = [lo - Math.abs(lo) * 0.1 - 1, hi + Math.abs(hi) * 0.1 + 1];
  const pad = (hi - lo) * 0.1;
  lo -= pad;
  hi += pad;

  const plotW = Math.max(0, width - GUTTER_LEFT - 8);
  const plotH = height - GUTTER_BOTTOM - GUTTER_TOP;
  const step = points.length > 1 ? plotW / (points.length - 1) : 0;
  const x = (i: number) =>
    GUTTER_LEFT + (points.length > 1 ? i * step : plotW / 2);
  const y = (v: number) => GUTTER_TOP + plotH - ((v - lo) / (hi - lo)) * plotH;

  // Separate runs, so a gap (no checkpoint yet) is a gap, not a slope.
  const runs: string[] = [];
  let current = "";
  points.forEach((p, i) => {
    if (p.value === null) {
      if (current) runs.push(current);
      current = "";
      return;
    }
    current += `${current ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`;
  });
  if (current) runs.push(current);

  const lastIndex = points.reduce(
    (acc, p, i) => (p.value !== null ? i : acc),
    -1,
  );
  const selected = active !== null ? points[active] : undefined;

  const indexAt = (clientX: number, el: SVGSVGElement) => {
    if (points.length < 2) return 0;
    const i = Math.round(
      (clientX - el.getBoundingClientRect().left - GUTTER_LEFT) / step,
    );
    return Math.min(points.length - 1, Math.max(0, i));
  };

  return (
    <div className="space-y-2">
      <p
        className="text-muted-foreground h-5 truncate text-sm tabular-nums"
        aria-live="polite"
      >
        {selected ? (
          <>
            <span className="text-foreground font-medium">
              {selected.label}
            </span>
            {" · "}
            {selected.value === null
              ? "hali hisob yo'q"
              : formatValue(selected.value)}
          </>
        ) : (
          idleText
        )}
      </p>
      <div ref={ref} className="w-full">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            className="focus-visible:ring-ring touch-pan-y rounded-sm outline-none focus-visible:ring-2"
            onPointerMove={(e) =>
              setActive(indexAt(e.clientX, e.currentTarget))
            }
            onPointerDown={(e) =>
              setActive(indexAt(e.clientX, e.currentTarget))
            }
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const d = e.key === "ArrowRight" ? 1 : -1;
                setActive((i) =>
                  Math.min(
                    points.length - 1,
                    Math.max(0, (i ?? lastIndex) + d),
                  ),
                );
              }
            }}
          >
            {[0, 0.5, 1].map((f) => {
              const v = lo + (hi - lo) * f;
              return (
                <g key={f}>
                  <line
                    x1={GUTTER_LEFT}
                    x2={width}
                    y1={y(v)}
                    y2={y(v)}
                    className="stroke-border"
                  />
                  <text
                    x={GUTTER_LEFT - 6}
                    y={y(v)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] tabular-nums"
                  >
                    {formatAxis(v)}
                  </text>
                </g>
              );
            })}
            {runs.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                className="stroke-foreground"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {active !== null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={GUTTER_TOP}
                y2={GUTTER_TOP + plotH}
                className="stroke-muted-foreground"
                strokeDasharray="3 3"
              />
            )}
            {[active ?? lastIndex].map((i) => {
              const v = i >= 0 ? points[i]?.value : null;
              return v === null || v === undefined ? null : (
                <circle
                  key="dot"
                  cx={x(i)}
                  cy={y(v)}
                  r={4}
                  className="fill-foreground stroke-card"
                  strokeWidth={2}
                />
              );
            })}
            {points.map((p, i) =>
              p.tick ? (
                <text
                  key={p.key}
                  x={x(i)}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {p.tick}
                </text>
              ) : null,
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

/* ------------------------- income vs spending bars ------------------------- */

export interface FlowBar {
  key: string;
  income: number;
  spent: number;
  label: string;
  tick: string;
}

/**
 * Two bars per month: income (light) and spending (solid). A legend names
 * them and the readout spells out both plus the difference, so the two
 * shades never have to carry the meaning alone.
 */
export function FlowChart({
  bars,
  formatValue,
  formatAxis,
  ariaLabel,
  height = 170,
}: {
  bars: FlowBar[];
  formatValue: (v: number) => string;
  formatAxis: (v: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);

  const max = niceCeil(
    Math.max(0, ...bars.flatMap((b) => [b.income, b.spent])),
  );
  const plotW = Math.max(0, width - GUTTER_LEFT);
  const plotH = height - GUTTER_BOTTOM - GUTTER_TOP;
  const slot = bars.length ? plotW / bars.length : 0;
  const barW = Math.max(1, Math.min(14, (slot - 6) / 2));
  const y = (v: number) => GUTTER_TOP + plotH - (v / max) * plotH;

  const indexAt = (clientX: number, el: SVGSVGElement) => {
    const i = Math.floor(
      (clientX - el.getBoundingClientRect().left - GUTTER_LEFT) / slot,
    );
    return i >= 0 && i < bars.length ? i : null;
  };

  const bar = (x: number, v: number, className: string) => {
    if (v <= 0) return null;
    const top = y(v);
    const h = GUTTER_TOP + plotH - top;
    const r = Math.min(3, barW / 2, h);
    return (
      <path
        d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
        className={className}
      />
    );
  };

  const sel = active !== null ? bars[active] : undefined;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p
          className="text-muted-foreground h-5 truncate text-sm tabular-nums"
          aria-live="polite"
        >
          {sel ? (
            <>
              <span className="text-foreground font-medium">{sel.label}</span>
              {` · kirim ${formatValue(sel.income)} · sarf ${formatValue(sel.spent)} · qoldi `}
              <span className="text-foreground font-medium">
                {sel.income - sel.spent > 0 ? "+" : ""}
                {formatValue(sel.income - sel.spent)}
              </span>
            </>
          ) : (
            "Oyni bosing: kirim, sarf va qolgani"
          )}
        </p>
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-foreground/30 inline-block size-2.5 rounded-sm" />{" "}
            Kirim
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-foreground inline-block size-2.5 rounded-sm" />{" "}
            Sarf
          </span>
        </div>
      </div>
      <div ref={ref} className="w-full">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            className="focus-visible:ring-ring touch-pan-y rounded-sm outline-none focus-visible:ring-2"
            onPointerMove={(e) =>
              setActive(indexAt(e.clientX, e.currentTarget))
            }
            onPointerDown={(e) =>
              setActive(indexAt(e.clientX, e.currentTarget))
            }
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const d = e.key === "ArrowRight" ? 1 : -1;
                setActive((i) =>
                  Math.min(
                    bars.length - 1,
                    Math.max(0, (i ?? (d > 0 ? -1 : bars.length)) + d),
                  ),
                );
              }
            }}
          >
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line
                  x1={GUTTER_LEFT}
                  x2={width}
                  y1={y(max * f)}
                  y2={y(max * f)}
                  className="stroke-border"
                />
                <text
                  x={GUTTER_LEFT - 6}
                  y={y(max * f)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {f === 0 ? "0" : formatAxis(max * f)}
                </text>
              </g>
            ))}
            {bars.map((b, i) => {
              const left = GUTTER_LEFT + i * slot + (slot - (barW * 2 + 2)) / 2;
              const dim = active !== null && active !== i;
              return (
                <g
                  key={b.key}
                  className={cn("transition-opacity", dim && "opacity-40")}
                >
                  {active === i && (
                    <rect
                      x={GUTTER_LEFT + i * slot}
                      y={GUTTER_TOP}
                      width={slot}
                      height={plotH}
                      className="fill-muted"
                    />
                  )}
                  {bar(left, b.income, "fill-foreground/30")}
                  {bar(left + barW + 2, b.spent, "fill-foreground")}
                  {b.tick && (
                    <text
                      x={GUTTER_LEFT + i * slot + slot / 2}
                      y={height - 6}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {b.tick}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
