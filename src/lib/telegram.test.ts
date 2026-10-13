import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { signInWithInitData } from "@/lib/telegram";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

function reply(status: number, body: unknown) {
  return { status, ok: status < 300, json: async () => body } as Response;
}

describe("signInWithInitData", () => {
  it("posts init data without cookies and returns the viewer token", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, {
        token: "t",
        expires_at: "2026-10-13T12:00:00Z",
        user: { id: 42, first_name: "I" },
      }),
    );
    const res = await signInWithInitData("query_id=1&hash=abc");
    expect(res.token).toBe("t");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain("/tg/auth");
    // The admin session cookie must never ride along from inside Telegram.
    expect(init.credentials).toBe("omit");
    expect(JSON.parse(init.body)).toEqual({ init_data: "query_id=1&hash=abc" });
  });

  it("surfaces a refusal with its status", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(403, { error: "this telegram account has no access" }),
    );
    const err = await signInWithInitData("x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
  });
});
