import Cookies from "js-cookie";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

const TOKEN_KEY = "pf_token";

export const tokenStore = {
  get(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },
  set(token: string) {
    Cookies.set(TOKEN_KEY, token, {
      expires: 1,
      sameSite: "lax",
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    });
  },
  clear() {
    Cookies.remove(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth = true, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 401) {
    tokenStore.clear();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}
