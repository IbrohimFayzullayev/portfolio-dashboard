"use client";

import * as React from "react";
import Script from "next/script";
import { useTheme } from "next-themes";

import { API_URL, ApiError } from "@/lib/api";

/**
 * The Telegram Mini App session.
 *
 * Telegram opens /tg with signed "init data" describing who opened it. The
 * page trades that for a read-only viewer token (POST /tg/auth) and keeps the
 * token in memory only: no cookie, no localStorage. Requests send it as a
 * Bearer header with `credentials: "omit"`, so the dashboard's admin cookie is
 * never attached here even if the same browser happens to have one.
 *
 * Init data stays valid for a day, the token for four hours; when the token
 * runs out mid-session the page simply signs in again with the same init data.
 */

interface TelegramWebApp {
  initData: string;
  colorScheme: "light" | "dark";
  ready(): void;
  expand(): void;
  onEvent(event: "themeChanged", cb: () => void): void;
  offEvent(event: "themeChanged", cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

type Status = "loading" | "ready" | "outside" | "denied" | "error";

interface TelegramSession {
  status: Status;
  error: string;
  firstName: string;
  get: <T>(path: string, signal?: AbortSignal) => Promise<T>;
  retry: () => void;
}

const TelegramSessionContext = React.createContext<TelegramSession | null>(
  null,
);

export function useTelegramSession(): TelegramSession {
  const ctx = React.useContext(TelegramSessionContext);
  if (!ctx)
    throw new Error(
      "useTelegramSession must be used within TelegramSessionProvider",
    );
  return ctx;
}

interface AuthResponse {
  token: string;
  expires_at: string;
  user: { id: number; first_name: string };
}

/** Exchanges init data for a viewer token. Exported for tests. */
export async function signInWithInitData(
  initData: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/tg/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ init_data: initData }),
    credentials: "omit",
  });
  const data = (await res.json().catch(() => null)) as
    | (AuthResponse & { error?: string })
    | null;
  if (!res.ok || !data?.token) {
    throw new ApiError(
      res.status,
      data?.error || `Sign-in failed (${res.status})`,
    );
  }
  return data;
}

// Telegram's own script; it reads the init data out of the URL Telegram opened.
const TELEGRAM_SCRIPT = "https://telegram.org/js/telegram-web-app.js";

export function TelegramSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();
  const [status, setStatus] = React.useState<Status>("loading");
  const [error, setError] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [scriptReady, setScriptReady] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  const initData = React.useRef("");
  const token = React.useRef<{ value: string; expiresAt: number } | null>(null);
  const pending = React.useRef<Promise<string> | null>(null);

  const signIn = React.useCallback(async (): Promise<string> => {
    // One sign-in at a time, however many queries notice the token is gone.
    if (!pending.current) {
      pending.current = signInWithInitData(initData.current)
        .then((res) => {
          token.current = {
            value: res.token,
            expiresAt: Date.parse(res.expires_at),
          };
          setFirstName(res.user.first_name);
          return res.token;
        })
        .finally(() => {
          pending.current = null;
        });
    }
    return pending.current;
  }, []);

  // Telegram's script may already be cached and loaded before React runs.
  // The timer is only a backstop for a script that never answers at all;
  // "outside" has a retry button for the slow-network case.
  React.useEffect(() => {
    if (window.Telegram?.WebApp) setScriptReady(true);
    const timer = window.setTimeout(() => setScriptReady(true), 10_000);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!scriptReady) return;
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) {
      setStatus("outside");
      return;
    }

    tg.ready();
    tg.expand();
    const syncTheme = () =>
      setTheme(tg.colorScheme === "dark" ? "dark" : "light");
    syncTheme();
    tg.onEvent("themeChanged", syncTheme);

    initData.current = tg.initData;
    setStatus("loading");
    signIn()
      .then(() => setStatus("ready"))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          setStatus("denied");
        } else {
          setError(err instanceof Error ? err.message : "Sign-in failed");
          setStatus("error");
        }
      });

    return () => tg.offEvent("themeChanged", syncTheme);
  }, [scriptReady, attempt, setTheme, signIn]);

  const get = React.useCallback(
    async <T,>(path: string, signal?: AbortSignal): Promise<T> => {
      const call = async (bearer: string) =>
        fetch(`${API_URL}${path}`, {
          headers: { Authorization: `Bearer ${bearer}` },
          credentials: "omit",
          signal,
        });

      const fresh =
        token.current && token.current.expiresAt - Date.now() > 60_000;
      let res = await call(fresh ? token.current!.value : await signIn());
      if (res.status === 401) {
        // Expired between the check and the request: once more, freshly.
        token.current = null;
        res = await call(await signIn());
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        throw new ApiError(
          res.status,
          data?.error || `Request failed (${res.status})`,
        );
      }
      return data as T;
    },
    [signIn],
  );

  const value = React.useMemo<TelegramSession>(
    () => ({
      status,
      error,
      firstName,
      get,
      retry: () => setAttempt((n) => n + 1),
    }),
    [status, error, firstName, get],
  );

  return (
    <TelegramSessionContext.Provider value={value}>
      <Script
        src={TELEGRAM_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setScriptReady(true)}
      />
      {children}
    </TelegramSessionContext.Provider>
  );
}
