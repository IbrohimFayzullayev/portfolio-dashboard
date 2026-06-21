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
}

export type ContentStatus = "all" | "draft" | "published";
