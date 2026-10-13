"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A single-series bar chart in plain SVG: days of a month, months of a year.
 * One series, so one colour (the foreground ink) and no legend; the title
 * above it names what is plotted. Hover, tap or arrow keys select a bar and
 * the line above the plot reads its exact value, which is the only way to
 * read exact values on a phone.
 */

export interface Bar {
  key: string;
  value: number;
  /** Shown in the readout: "12.10", "Oktabr 2026". */
  label: string;
  /** Axis tick under the bar, or "" for none. */
  tick: string;
}

interface Props {
  bars: Bar[];
  formatValue: (v: number) => string;
  formatAxis: (v: number) => string;
  /** Readout when nothing is selected. */
  idleText?: string;
  height?: number;
  className?: string;
  ariaLabel: string;
}

const GUTTER_LEFT = 44;
const GUTTER_BOTTOM = 22;
const GUTTER_TOP = 6;

/** 1, 2, 2.5, 5 × 10ⁿ — gridlines on numbers people read without effort. */
export function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (v <= step * exp) return step * exp;
  }
  return 10 * exp;
}

function useWidth<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  number,
] {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function BarChart({
  bars,
  formatValue,
  formatAxis,
  idleText,
  height = 170,
  className,
  ariaLabel,
}: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = React.useState<number | null>(null);

  const max = niceCeil(Math.max(0, ...bars.map((b) => b.value)));
  const plotW = Math.max(0, width - GUTTER_LEFT);
  const plotH = height - GUTTER_BOTTOM - GUTTER_TOP;
  const slot = bars.length ? plotW / bars.length : 0;
  // Thin marks: never wider than 28px, and a 2px gap between neighbours.
  const barW = Math.max(1, Math.min(28, slot - 2));
  const y = (v: number) => GUTTER_TOP + plotH - (v / max) * plotH;

  const indexAt = (clientX: number, el: SVGSVGElement) => {
    const x = clientX - el.getBoundingClientRect().left - GUTTER_LEFT;
    const i = Math.floor(x / slot);
    return i >= 0 && i < bars.length ? i : null;
  };

  const selected = active !== null ? bars[active] : undefined;

  return (
    <div className={cn("space-y-2", className)}>
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
            {formatValue(selected.value)}
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
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setActive(null);
            }}
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
              } else if (e.key === "Escape") {
                setActive(null);
              }
            }}
            onBlur={() => setActive(null)}
          >
            {/* Recessive grid: three lines, labelled at the left. */}
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line
                  x1={GUTTER_LEFT}
                  x2={width}
                  y1={y(max * f)}
                  y2={y(max * f)}
                  className="stroke-border"
                  strokeWidth={1}
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
              const x = GUTTER_LEFT + i * slot + (slot - barW) / 2;
              const top = y(b.value);
              const h = GUTTER_TOP + plotH - top;
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={b.key}>
                  {active === i && (
                    <rect
                      x={GUTTER_LEFT + i * slot}
                      y={GUTTER_TOP}
                      width={slot}
                      height={plotH}
                      className="fill-muted"
                    />
                  )}
                  {b.value > 0 && (
                    // Rounded at the data end only; square on the baseline.
                    <path
                      d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                      className={cn(
                        "fill-foreground transition-opacity",
                        active !== null && active !== i && "opacity-40",
                      )}
                    />
                  )}
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
