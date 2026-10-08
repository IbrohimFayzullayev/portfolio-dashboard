import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError, onUnauthorized } from "@/lib/api";

/**
 * apiFetch is the single choke point for every dashboard request. These tests
 * mock fetch to verify: that the session cookie is sent and no token is ever
 * handled in JavaScript, JSON body serialization, the 204 no-content shortcut,
 * error mapping, and what a 401 means in each of the two places it can occur.
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("parses a JSON response", async () => {
    fetchMock.mockResolvedValueOnce(response(200, JSON.stringify({ id: 1 })));
    const data = await apiFetch<{ id: number }>("/posts");
    expect(data).toEqual({ id: 1 });
    expect(fetchMock.mock.calls[0]![0]).toContain("/posts");
  });

  it("sends the session cookie and never an Authorization header", async () => {
    fetchMock.mockResolvedValueOnce(response(200, "[]"));
    await apiFetch("/posts");

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    // The cookie is HttpOnly: the browser attaches it, and only when asked.
    expect(init.credentials).toBe("include");
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("asks for credentials on login too, or the cookie would be discarded", async () => {
    fetchMock.mockResolvedValueOnce(response(200, "{}"));
    await apiFetch("/auth/login", { method: "POST", body: {}, auth: false });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.credentials).toBe("include");
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

  it("announces an expired session on a 401", async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    fetchMock.mockResolvedValue(response(401, "", false));

    await expect(apiFetch("/posts")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await apiFetch("/posts").catch(() => {});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reports a wrong password as what the server said, not as an expiry", async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    fetchMock.mockResolvedValueOnce(
      response(401, JSON.stringify({ error: "invalid email or password" }), false),
    );

    await expect(
      apiFetch("/auth/login", { method: "POST", body: {}, auth: false }),
    ).rejects.toThrow("invalid email or password");
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("maps a server error message into ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      response(409, JSON.stringify({ error: "slug already exists" }), false),
    );
    await expect(apiFetch("/posts", { method: "POST", body: {} })).rejects.toThrow(
      "slug already exists",
    );
  });

  it("survives a non-JSON error body", async () => {
    fetchMock.mockResolvedValueOnce(response(502, "<html>Bad Gateway</html>", false));
    await expect(apiFetch("/posts")).rejects.toThrow(
      "Request failed with status 502",
    );
  });

  it("throws ApiError instances (so callers can read .status)", async () => {
    fetchMock.mockResolvedValueOnce(response(500, "", false));
    const err: unknown = await apiFetch("/posts").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});
