export type Locale = "en" | "uz";

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  user: User;
}

export interface Post {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  cover: string;
  featured: boolean;
  draft: boolean;
  date: string;
  translation_key: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostInput {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  cover: string;
  featured: boolean;
  draft: boolean;
  date: string;
  /** Pairs this row with its other-language version; "" when there is none. */
  translation_key: string;
}

export interface Project {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  stack: string[];
  url: string;
  repo: string;
  order: number;
  featured: boolean;
  draft: boolean;
  date: string;
  translation_key: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  stack: string[];
  url: string;
  repo: string;
  order: number;
  featured: boolean;
  draft: boolean;
  date: string;
  /** Pairs this row with its other-language version; "" when there is none. */
  translation_key: string;
}

export type ContentStatus = "all" | "draft" | "published";

/** A submission from the standalone invitation site (the "date planner"). */
export interface Invitation {
  id: string;
  source: string;
  session_id: string;
  /** Empty for invitations submitted before the site asked for a name. */
  guest_name: string;
  date: string;
  time: string;
  food_id: string;
  food_label: string;
  food_emoji: string;
  place_id: string;
  place_label: string;
  place_emoji: string;
  /** The exact venue; venue_custom is true when the visitor typed it. */
  venue_id: string;
  venue_name: string;
  venue_custom: boolean;
  invite_text: string;
  user_agent: string;
  created_at: string;
}

export interface InvitationList {
  items: Invitation[];
  total: number;
}

/* ---------------------------- contact messages --------------------------- */

/** One message sent through the public site's contact form. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  /** Language the visitor was reading in: "en", "uz" or "". */
  locale: string;
  user_agent: string;
  /** null until opened here. */
  read_at: string | null;
  created_at: string;
}

export interface ContactMessageList {
  items: ContactMessage[];
  total: number;
  unread: number;
}

/* --------------------------------- system -------------------------------- */

export interface SystemErrorGroup {
  fingerprint: string;
  /** "api", "web" or "dashboard". */
  service: string;
  route: string;
  /** 0 info, 1 warning, 2 critical. */
  severity: number;
  message: string;
  count: number;
  first_seen: string;
  last_seen: string;
  muted_until: string | null;
}

export interface SystemHealthTarget {
  target: string;
  ok: boolean;
  latency_ms: number;
  detail: string;
  checked_at: string;
  checks_7d: number;
  /** Percentage, 0–100. */
  uptime_7d: number;
  last_failure: string | null;
}

export interface SystemDeploy {
  service: string;
  sha: string;
  at: string;
}

export interface SystemOverview {
  generated_at: string;
  errors: SystemErrorGroup[];
  health: SystemHealthTarget[];
  deploys: SystemDeploy[];
  outbox: { pending: number; parked: number; last_sent_at: string | null };
  /** null until the bot has ever written a heartbeat. */
  bot: { beat_at: string; note: string } | null;
  /** null until a backup has ever finished. */
  backup: { at: string; size: string; file: string } | null;
}
