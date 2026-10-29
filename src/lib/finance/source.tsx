"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api";

/**
 * Where the money pages get their data from.
 *
 * The same components run in three places with three different credentials:
 *
 *   - "admin": the dashboard, signed in with the HttpOnly session cookie
 *     (apiFetch). May edit.
 *   - "tg": the ops bot's Telegram Mini App, with a read-only viewer token
 *     held in memory (see lib/telegram.tsx). Never edits; the API would
 *     refuse anyway.
 *   - "finbot": the separate finance bot's Mini App (/pul), against that
 *     bot's own API and database. The person's own money, so they may edit.
 *   - "finbot-admin:<id>": one finance-bot user's report in the dashboard
 *     (/finbot/<id>), through the portfolio API's /finbot proxy. Read-only:
 *     the admin checks, the owner edits.
 *
 * Components ask this context instead of importing a fetcher, so no
 * credential can leak into another place by accident. Writes go through
 * `send` for the same reason.
 */
export interface FinanceSource {
  /** Also the cache key, so two sources never share data. */
  id: "admin" | "tg" | "finbot" | `finbot-admin:${number}`;
  get: <T>(path: string, signal?: AbortSignal) => Promise<T>;
  send: <T>(
    path: string,
    options: { method: string; body?: unknown },
  ) => Promise<T>;
  canEdit: boolean;
}

/** For read-only sources: a write that slips through fails loudly. */
export function readOnlySend(): Promise<never> {
  return Promise.reject(new Error("This view is read-only."));
}

const FinanceSourceContext = React.createContext<FinanceSource | null>(null);

export function FinanceSourceProvider({
  source,
  children,
}: {
  source: FinanceSource;
  children: React.ReactNode;
}) {
  return (
    <FinanceSourceContext.Provider value={source}>
      {children}
    </FinanceSourceContext.Provider>
  );
}

export function useFinanceSource(): FinanceSource {
  const ctx = React.useContext(FinanceSourceContext);
  if (!ctx)
    throw new Error(
      "useFinanceSource must be used within FinanceSourceProvider",
    );
  return ctx;
}

export const adminFinanceSource: FinanceSource = {
  id: "admin",
  get: (path, signal) => apiFetch(path, { signal }),
  send: (path, { method, body }) => apiFetch(path, { method, body }),
  canEdit: true,
};
