"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { Amounts } from "@/lib/finance/types";

/*
 * The finance bot's users, as the admin sees them in the dashboard.
 *
 * Requests go to the portfolio API's /finbot routes (admin session), which
 * forward them to the finance bot (internal/api/finbot_proxy.go). The
 * dashboard never talks to the finance bot directly.
 */

export type FinbotStatus = "pending" | "active" | "blocked";

export interface FinbotUserMoney {
  month_spent: Amounts;
  month_income: Amounts;
  /** Null before the person's first /balans. */
  in_hand: Amounts | null;
  /** Counted minus computed at the last recount, tiyin: unwritten money. */
  last_gap_minor: number | null;
}

export interface FinbotUser {
  id: number;
  telegram_id: number;
  first_name: string;
  username: string;
  status: FinbotStatus;
  joined_via: string;
  daily_summary: boolean;
  created_at: string;
  approved_at: string | null;
  last_seen_at: string | null;
  last_entry_at: string | null;
  entries: number;
  entries_7d: number;
  entries_30d: number;
  active_days_30: number;
  corrected: number;
  failures_30d: number;
  checkpoints: number;
  /** Null when amounts are hidden from the admin. */
  money: FinbotUserMoney | null;
}

export interface FinbotUsersResponse {
  users: FinbotUser[];
  counts: {
    total: number;
    active: number;
    pending: number;
    blocked: number;
    active_7d: number;
  };
  money_visible: boolean;
  bot_username: string;
}

export interface FinbotFailure {
  text: string;
  reason: "no_amount" | "no_person" | "other";
  created_at: string;
}

export interface FinbotUserResponse {
  user: FinbotUser;
  failures: FinbotFailure[];
  money_visible: boolean;
}

export function useFinbotUsers() {
  return useQuery({
    queryKey: ["finbot-admin", "users"],
    queryFn: ({ signal }) =>
      apiFetch<FinbotUsersResponse>("/finbot/users", { signal }),
    refetchInterval: 60_000,
  });
}

export function useFinbotUser(id: number) {
  return useQuery({
    queryKey: ["finbot-admin", "user", id],
    queryFn: ({ signal }) =>
      apiFetch<FinbotUserResponse>(`/finbot/users/${id}`, { signal }),
  });
}

export function useSetFinbotStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "active" | "blocked";
    }) =>
      apiFetch<{ status: string; notice: string }>(
        `/finbot/users/${id}/status`,
        { method: "POST", body: { status } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finbot-admin"] }),
  });
}

/** "Ali (@ali)" - how a person is named everywhere in these pages. */
export function finbotName(u: Pick<FinbotUser, "first_name" | "username">) {
  const name = u.first_name.trim() || "Ismsiz";
  return u.username ? `${name} (@${u.username})` : name;
}

/** How the person got in, in words. */
export function joinedVia(v: string): string {
  if (v === "admin") return "admin";
  if (v === "approved") return "so'rov orqali";
  if (v.startsWith("invite:")) return "taklif havolasi";
  return v || "-";
}

/**
 * A rough health signal for "does this person manage to use the bot":
 * the share of their messages in 30 days that the bot could not read.
 */
export function failureRate(u: FinbotUser): number | null {
  const total = u.entries_30d + u.failures_30d;
  if (total === 0) return null;
  return Math.round((u.failures_30d / total) * 100);
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

/** "hozir", "5 daqiqa oldin", "3 soat oldin", "2 kun oldin". */
export function ago(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "-";
  const minutes = Math.max(0, Math.round((now.getTime() - then) / 60_000));
  if (minutes < 1) return "hozir";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}
