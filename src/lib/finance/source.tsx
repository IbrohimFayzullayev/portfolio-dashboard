"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api";

/**
 * Where the money pages get their data from.
 *
 * The same components run in two places with two different credentials:
 *
 *   - "admin": the dashboard, signed in with the HttpOnly session cookie
 *     (apiFetch). May edit.
 *   - "tg": the Telegram Mini App, with a read-only viewer token held in
 *     memory (see lib/telegram.tsx). Never edits; the API would refuse anyway.
 *
 * Components ask this context instead of importing a fetcher, so neither
 * credential can leak into the other place by accident.
 */
export interface FinanceSource {
  id: "admin" | "tg";
  get: <T>(path: string, signal?: AbortSignal) => Promise<T>;
  canEdit: boolean;
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
  canEdit: true,
};
