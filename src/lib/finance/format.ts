import type { Amounts, Currency } from "./types";

/*
 * Formatting and date arithmetic for the money pages. Pure functions only:
 * the same rules as the bot (internal/bot/financeparse.go), so a number reads
 * the same in Telegram and on the page.
 */

const NBSP = " ";

function groupThousands(n: number): string {
  return Math.trunc(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** "35 000 so'm", "$12.50", "$1 200". Spaces are non-breaking. */
export function formatMoney(minor: number, currency: Currency = "UZS"): string {
  const negative = minor < 0;
  const abs = Math.abs(Math.round(minor));
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;

  let s = groupThousands(whole);
  if (cents !== 0) s += "." + cents.toString().padStart(2, "0");
  s = currency === "USD" ? "$" + s : s + NBSP + "so'm";
  return negative ? "-" + s : s;
}

/** "1 250 000 so'm + $300"; "0 so'm" when empty. */
export function formatAmounts(a: Amounts | undefined | null): string {
  const parts: string[] = [];
  for (const cur of ["UZS", "USD"] as const) {
    const v = a?.[cur];
    if (v) parts.push(formatMoney(v, cur));
  }
  return parts.length ? parts.join(" + ") : "0" + NBSP + "so'm";
}

/** Axis labels: "350k", "1.2 mln", "12 mln". Takes minor units of so'm. */
export function compactSom(minor: number): string {
  const som = minor / 100;
  const abs = Math.abs(som);
  if (abs >= 1_000_000) {
    const m = som / 1_000_000;
    return `${Math.abs(m) >= 10 ? Math.round(m) : trimZero(m.toFixed(1))}${NBSP}mln`;
  }
  if (abs >= 1_000) return `${Math.round(som / 1_000)}k`;
  return `${Math.round(som)}`;
}

function trimZero(s: string): string {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** Percentage change, or null when there is no baseline to compare with. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (!previous || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * What a person types into an amount field: "35000", "35 000", "35k",
 * "1.5 mln", "12,50". Returns minor units, or null when it is not a number.
 * Unlike the bot there is no "35 means 35 000" guess: a form field says
 * exactly what it means.
 */
export function parseAmountInput(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/[\s ]/g, "");
  const m = /^(\d+(?:[.,]\d+)?)(k|ming|mln|m)?$/.exec(s);
  if (!m) return null;
  const value = Number(m[1]!.replace(",", "."));
  const mult = m[2] === "k" || m[2] === "ming" ? 1_000 : m[2] ? 1_000_000 : 1;
  const minor = Math.round(value * mult * 100);
  return minor > 0 ? minor : null;
}

/** The inverse, for filling the field when editing: 3500000 → "35000". */
export function amountInputValue(minor: number): string {
  const v = minor / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/* --------------------------------- dates ---------------------------------- */

const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];
const UZ_MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];

interface YMD {
  y: number;
  m: number; // 1..12
  d: number;
}

function parseISODate(iso: string): YMD {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m!, d: d ?? 1 };
}

function toISO({ y, m, d }: YMD): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Calendar arithmetic in UTC, so no local time zone can shift a day. */
export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISODate(iso);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return toISO({
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
  });
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "05.10" — or "05.10.2025" when not this year. */
export function formatDay(iso: string, thisYear?: number): string {
  const { y, m, d } = parseISODate(iso);
  const base = `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}`;
  return thisYear !== undefined && y !== thisYear ? `${base}.${y}` : base;
}

/** "Oktabr 2026" from "2026-10" or "2026-10-05". */
export function formatMonth(iso: string): string {
  const { y, m } = parseISODate(iso);
  return `${UZ_MONTHS[m - 1]} ${y}`;
}

export function formatMonthShort(iso: string): string {
  return UZ_MONTHS_SHORT[parseISODate(iso).m - 1]!;
}

/** Whole days from `fromISO` to `toISO`. */
export function daysBetween(fromISO: string, toISODate: string): number {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISODate);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000,
  );
}

/** Today as the browser sees it — only a fallback until the server says. */
export function localToday(): string {
  const now = new Date();
  return toISO({
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate(),
  });
}

/* -------------------------------- periods --------------------------------- */

export type PresetKey = "month" | "last-month" | "7d" | "30d" | "year";

export interface Period {
  key: PresetKey | "custom";
  label: string;
  from: string;
  to: string;
  /** What to compare with, when there is a natural answer. */
  compareFrom?: string;
  compareTo?: string;
  compareLabel?: string;
}

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "month", label: "Shu oy" },
  { key: "last-month", label: "O'tgan oy" },
  { key: "7d", label: "7 kun" },
  { key: "30d", label: "30 kun" },
  { key: "year", label: "Yil" },
];

export function periodFor(key: PresetKey, today: string): Period {
  const t = parseISODate(today);
  const monthStart = toISO({ y: t.y, m: t.m, d: 1 });

  switch (key) {
    case "month": {
      // Against the same days of last month — the bot's /hisob comparison.
      const pm = t.m === 1 ? { y: t.y - 1, m: 12 } : { y: t.y, m: t.m - 1 };
      const day = Math.min(t.d, daysInMonth(pm.y, pm.m));
      return {
        key,
        label: `${UZ_MONTHS[t.m - 1]} 1-${t.d}`,
        from: monthStart,
        to: today,
        compareFrom: toISO({ ...pm, d: 1 }),
        compareTo: toISO({ ...pm, d: day }),
        compareLabel: "o'tgan oy shu kunlarda",
      };
    }
    case "last-month": {
      const pm = t.m === 1 ? { y: t.y - 1, m: 12 } : { y: t.y, m: t.m - 1 };
      const ppm =
        pm.m === 1 ? { y: pm.y - 1, m: 12 } : { y: pm.y, m: pm.m - 1 };
      return {
        key,
        label: `${UZ_MONTHS[pm.m - 1]} ${pm.y}`,
        from: toISO({ ...pm, d: 1 }),
        to: toISO({ ...pm, d: daysInMonth(pm.y, pm.m) }),
        compareFrom: toISO({ ...ppm, d: 1 }),
        compareTo: toISO({ ...ppm, d: daysInMonth(ppm.y, ppm.m) }),
        compareLabel: `${UZ_MONTHS[ppm.m - 1]!.toLowerCase()}ga nisbatan`,
      };
    }
    case "7d":
    case "30d": {
      const n = key === "7d" ? 7 : 30;
      const from = addDays(today, -(n - 1));
      return {
        key,
        label: `Oxirgi ${n} kun`,
        from,
        to: today,
        compareFrom: addDays(from, -n),
        compareTo: addDays(from, -1),
        compareLabel: `oldingi ${n} kunga nisbatan`,
      };
    }
    case "year":
      return {
        key,
        label: `${t.y} yil`,
        from: toISO({ y: t.y, m: 1, d: 1 }),
        to: today,
        compareFrom: toISO({ y: t.y - 1, m: 1, d: 1 }),
        compareTo: toISO({
          y: t.y - 1,
          m: t.m,
          d: Math.min(t.d, daysInMonth(t.y - 1, t.m)),
        }),
        compareLabel: "o'tgan yil shu davrda",
      };
  }
}

export function customPeriod(from: string, to: string): Period {
  return {
    key: "custom",
    label: `${formatDay(from)}-${formatDay(to)}`,
    from,
    to,
  };
}
