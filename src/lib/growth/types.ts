/* Mirrors internal/api/growth_handler.go and notes_handler.go. Dates are
 * "YYYY-MM-DD" calendar days in Asia/Tashkent. */

export type GrowthKind =
  | "writing"
  | "speaking"
  | "listening"
  | "reading"
  | "vocab"
  | "grammar"
  | "mock"
  | "other";

export type SprintOutcome = "done" | "partial" | "missed";

export interface GrowthDay {
  date: string;
  minutes: number;
  by_kind: Partial<Record<GrowthKind, number>>;
}

export interface GrowthSprint {
  id: string;
  goal: string;
  starts_on: string;
  ends_on: string;
  open: boolean;
  outcome: SprintOutcome | null;
  result_note: string;
  minutes: number;
  active_days: number;
  working_days: number;
  recordings: number;
  by_kind: Partial<Record<GrowthKind, number>>;
}

export interface GrowthScore {
  taken_on: string;
  kind: "mock" | "official" | "tutor";
  overall: number;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  note: string;
}

export interface GrowthSummary {
  from: string;
  to: string;
  minutes: number;
  active_days: number;
  working_days: number;
  recordings: number;
  by_kind: Partial<Record<GrowthKind, number>>;
  by_day: GrowthDay[];
  sprints: GrowthSprint[];
  scores: GrowthScore[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  total_pages: number | null;
  status: "reading" | "finished" | "dropped";
  started_on: string;
  finished_on: string | null;
  minutes: number;
  days: number;
  sessions: number;
  last_page: number;
  percent: number;
}

export interface BooksSummary {
  year: number;
  minutes: number;
  days: number;
  sessions: number;
  by_month: { month: string; minutes: number; days: number }[];
  recent: { date: string; minutes: number }[];
  reading: Book[];
  finished: Book[];
  dropped: Book[];
}

export interface NoteMeta {
  slug: string;
  title: string;
}

export interface Note extends NoteMeta {
  body: string;
}
