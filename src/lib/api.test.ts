import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError, tokenStore } from "@/lib/api";

/**
 * apiFetch is the single choke point for every dashboard request. These tests
 * mock fetch to verify: auth header injection, JSON body serialization, the
 * 204 no-content shortcut, error mapping, and the important security behaviour
 * of clearing the token on a 401.
 */

function response(
  status: number,
  body: string,
  ok = status >= 200 && status < 300,
) {
  return {
    status,
    ok,
    text: async () => body,
  } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  tokenStore.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("tokenStore", () => {
  it("round-trips a token through the cookie", () => {
    tokenStore.set("abc123");
    expect(tokenStore.get()).toBe("abc123");
    tokenStore.clear();
    expect(tokenStore.get()).toBeUndefined();
  });
});

describe("apiFetch", () => {
  it("parses a JSON response", async () => {
    fetchMock.mockResolvedValueOnce(response(200, JSON.stringify({ id: 1 })));
    const data = await apiFetch<{ id: number }>("/posts");
    expect(data).toEqual({ id: 1 });
    expect(fetchMock.mock.calls[0]![0]).toContain("/posts");
  });

  it("attaches the bearer token when authenticated", async () => {
    tokenStore.set("my-token");
    fetchMock.mockResolvedValueOnce(response(200, "[]"));
    await apiFetch("/posts");

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer my-token");
  });

  it("omits the auth header when auth is disabled", async () => {
    tokenStore.set("my-token");
    fetchMock.mockResolvedValueOnce(response(200, "{}"));
    await apiFetch("/public/posts", { auth: false });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("serializes a body and sets Content-Type", async () => {
    fetchMock.mockResolvedValueOnce(response(201, JSON.stringify({ ok: true })));
    await apiFetch("/posts", { method: "POST", body: { title: "Hi" } });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ title: "Hi" }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("returns undefined on 204 No Content", async () => {
    fetchMock.mockResolvedValueOnce(response(204, ""));
    expect(await apiFetch("/posts/1", { method: "DELETE" })).toBeUndefined();
  });

  it("clears the token and throws on 401", async () => {
    tokenStore.set("expired");
    fetchMock.mockResolvedValueOnce(response(401, "", false));

    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect(tokenStore.get()).toBeUndefined();
  });

  it("maps a server error message into ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      response(409, JSON.stringify({ error: "slug already exists" }), false),
    );
    await expect(apiFetch("/posts", { method: "POST", body: {} })).rejects.toThrow(
      "slug already exists",
    );
  });

  it("throws ApiError instances (so callers can read .status)", async () => {
    fetchMock.mockResolvedValueOnce(response(500, "", false));
    const err: unknown = await apiFetch("/posts").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});
