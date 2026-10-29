import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  useCreateFinanceCheckpoint,
  useDeleteFinanceEntry,
  useFinanceDebts,
  useUpdateFinanceEntry,
} from "./hooks";
import { FinanceSourceProvider, type FinanceSource } from "./source";

function wrapperFor(source: FinanceSource) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <FinanceSourceProvider source={source}>
          {children}
        </FinanceSourceProvider>
      </QueryClientProvider>
    );
  };
}

function fakeSource(): FinanceSource & {
  get: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
} {
  return {
    id: "finbot",
    get: vi.fn().mockResolvedValue({ balances: [] }),
    send: vi.fn().mockResolvedValue(undefined),
    canEdit: true,
  };
}

describe("finance hooks go through the page's source", () => {
  it("reads with source.get", async () => {
    const src = fakeSource();
    const { result } = renderHook(() => useFinanceDebts(), {
      wrapper: wrapperFor(src),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(src.get).toHaveBeenCalledWith("/finance/debts", expect.anything());
  });

  it("writes with source.send, never with the admin session", async () => {
    const src = fakeSource();
    const wrapper = wrapperFor(src);

    const del = renderHook(() => useDeleteFinanceEntry(), { wrapper });
    await act(() => del.result.current.mutateAsync("abc"));
    expect(src.send).toHaveBeenLastCalledWith("/finance/entries/abc", {
      method: "DELETE",
    });

    const upd = renderHook(() => useUpdateFinanceEntry(), { wrapper });
    const input = {
      kind: "expense",
      amount_minor: 100,
      currency: "UZS",
      category: "ovqat",
      person: "",
      note: "",
      spent_on: "2026-10-29",
    } as const;
    await act(() => upd.result.current.mutateAsync({ id: "abc", input }));
    expect(src.send).toHaveBeenLastCalledWith("/finance/entries/abc", {
      method: "PUT",
      body: input,
    });

    const cp = renderHook(() => useCreateFinanceCheckpoint(), { wrapper });
    await act(() =>
      cp.result.current.mutateAsync({
        currency: "UZS",
        amount_minor: 5,
        date: "",
        note: "",
      }),
    );
    expect(src.send).toHaveBeenLastCalledWith("/finance/checkpoints", {
      method: "POST",
      body: { currency: "UZS", amount_minor: 5, date: "", note: "" },
    });
  });
});
