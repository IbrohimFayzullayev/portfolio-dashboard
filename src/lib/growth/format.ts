import type { GrowthKind, SprintOutcome } from "./types";

/** "45 daq", "1 s 20 daq", "3 s" — the same wording the bot uses. */
export function formatMinutes(m: number): string {
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} s` : `${h} s ${rest} daq`;
}

/** Axis labels: minutes up to an hour, hours after. */
export function axisMinutes(m: number): string {
  if (m < 60) return `${Math.round(m)}`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} s`;
}

export const KIND_ORDER: GrowthKind[] = [
  "writing",
  "speaking",
  "listening",
  "reading",
  "vocab",
  "grammar",
  "mock",
  "other",
];

export const KIND_LABEL: Record<GrowthKind, string> = {
  writing: "Writing",
  speaking: "Speaking",
  listening: "Listening",
  reading: "Reading",
  vocab: "Vocab",
  grammar: "Grammar",
  mock: "Mock",
  other: "Boshqa",
};

export const OUTCOME: Record<SprintOutcome, { label: string; icon: string }> = {
  done: { label: "Erishildi", icon: "✅" },
  partial: { label: "Qisman", icon: "🟡" },
  missed: { label: "Erishilmadi", icon: "❌" },
};

/** "6.5" — bands always with one decimal, as IELTS writes them. */
export function formatBand(v: number | null | undefined): string {
  return v === null || v === undefined ? "–" : v.toFixed(1);
}

/** Sprint "day n of total", counting Monday–Saturday only (Sunday is rest). */
export function sprintDay(
  startsOn: string,
  endsOn: string,
  today: string,
): { n: number; total: number } {
  let n = 0;
  let total = 0;
  const [sy, sm, sd] = startsOn.split("-").map(Number);
  const [ey, em, ed] = endsOn.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const end = Date.UTC(ey!, em! - 1, ed!);
  const now = Date.UTC(ty!, tm! - 1, td!);
  for (let t = Date.UTC(sy!, sm! - 1, sd!); t <= end; t += 86_400_000) {
    if (new Date(t).getUTCDay() === 0) continue;
    total++;
    if (t <= now) n++;
  }
  return { n, total };
}

/** Tabs of the Mini App, as they appear in its URL (?tab=). */
export const TABS = ["money", "growth", "books", "notes"] as const;
export type Tab = (typeof TABS)[number];

export function parseTab(search: string): { tab: Tab; doc: string } {
  const q = new URLSearchParams(search);
  const raw = q.get("tab") ?? "";
  const tab = (TABS as readonly string[]).includes(raw)
    ? (raw as Tab)
    : "money";
  const doc = q.get("doc") ?? "";
  // A slug is what the API knows: lower-case words and dashes, nothing else.
  return { tab, doc: /^[a-z0-9-]{1,64}$/.test(doc) ? doc : "" };
}
