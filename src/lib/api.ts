export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/**
 * Authentication is an HttpOnly cookie that the API sets on login and the
 * browser attaches by itself (`credentials: "include"` below).
 *
 * There is deliberately no token in this file. The dashboard used to keep the
 * JWT in a cookie it wrote from JavaScript — which any script running on the
 * page could read back, and this app renders author-written MDX. Now the page
 * never holds the credential at all, so there is nothing here to steal.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Called whenever an authenticated request comes back 401 — the session
 * expired or was never there. The auth context subscribes, so an expiry in the
 * middle of a working session sends the user to the login page instead of
 * leaving a screen full of failed requests.
 */
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /**
   * false for the requests made while there is no session yet (login). Their
   * 401 means "wrong password", not "session expired".
   */
  auth?: boolean;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth = true, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Always "include", also for login: that response is the one that SETS
    // the cookie, and a browser discards Set-Cookie on a cross-origin
    // response unless the request asked for credentials.
    credentials: "include",
    signal,
  });

  if (res.status === 401 && auth) {
    unauthorizedListeners.forEach((listener) => listener());
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // A proxy error page or an empty reply: fall through to the status.
    }
  }

  if (!res.ok) {
    const serverMessage =
      data && typeof data === "object" && "error" in data
        ? (data as { error: unknown }).error
        : undefined;
    throw new ApiError(
      res.status,
      typeof serverMessage === "string" && serverMessage
        ? serverMessage
        : `Request failed with status ${res.status}`,
    );
  }

  return data as T;
}
