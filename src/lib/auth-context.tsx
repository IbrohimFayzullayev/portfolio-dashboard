"use client";

import * as React from "react";

import { apiFetch, onUnauthorized } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * The cookie this dashboard used to write for itself. It is no longer read by
 * anything, but an old one would sit in the browser holding a valid token
 * until it expired — so it is removed on sight.
 */
function dropLegacyTokenCookie() {
  document.cookie = "pf_token=; Max-Age=0; path=/";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    dropLegacyTokenCookie();

    // The session cookie is invisible from here by design, so the only way to
    // know whether there is a session is to ask. `auth: false` because a 401
    // on this first question is the ordinary logged-out case, not an expiry.
    apiFetch<User>("/auth/me", { auth: false })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));

    // A 401 on any later request means the session ended under us.
    return onUnauthorized(() => setUser(null));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    // The response also carries the token, for clients that are not browsers.
    // It is ignored here on purpose: the cookie the API just set is the
    // session, and holding a second copy in JavaScript would defeat it.
    setUser(res.user);
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST", auth: false });
    } catch {
      // Unreachable API: the cookie outlives this click, but the UI still
      // signs out, and the cookie expires on its own.
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
