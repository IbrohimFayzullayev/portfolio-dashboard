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
  date: string;
  time: string;
  food_id: string;
  food_label: string;
  food_emoji: string;
  place_id: string;
  place_label: string;
  place_emoji: string;
  invite_text: string;
  user_agent: string;
  created_at: string;
}

export interface InvitationList {
  items: Invitation[];
  total: number;
}
