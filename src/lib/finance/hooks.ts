import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { useFinanceSource } from "./source";
import type {
  FinanceDebts,
  FinanceEntry,
  FinanceEntryFilter,
  FinanceEntryInput,
  FinanceEntryList,
  FinanceMeta,
  FinanceSummary,
} from "./types";

/* Reads go through the page's FinanceSource; writes are dashboard-only and
 * use the admin session directly. Query keys start with ["finance", source]
 * so the two credentials never share a cache entry. */

export function useFinanceMeta() {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["finance", src.id, "meta"],
    queryFn: ({ signal }) => src.get<FinanceMeta>("/finance/meta", signal),
    staleTime: 60 * 60 * 1000,
  });
}

export interface SummaryParams {
  from: string;
  to: string;
  compareFrom?: string;
  compareTo?: string;
}

export function useFinanceSummary(p: SummaryParams | null) {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["finance", src.id, "summary", p],
    queryFn: ({ signal }) => {
      const sp = new URLSearchParams({ from: p!.from, to: p!.to });
      if (p!.compareFrom && p!.compareTo) {
        sp.set("compare_from", p!.compareFrom);
        sp.set("compare_to", p!.compareTo);
      }
      return src.get<FinanceSummary>(`/finance/summary?${sp}`, signal);
    },
    enabled: p !== null,
    placeholderData: keepPreviousData,
  });
}

export function entryFilterQuery(f: FinanceEntryFilter): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function useFinanceEntries(f: FinanceEntryFilter, enabled = true) {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["finance", src.id, "entries", f],
    queryFn: ({ signal }) =>
      src.get<FinanceEntryList>(
        `/finance/entries${entryFilterQuery(f)}`,
        signal,
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useFinanceDebts(person = "") {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["finance", src.id, "debts", person],
    queryFn: ({ signal }) =>
      src.get<FinanceDebts>(
        `/finance/debts${person ? `?person=${encodeURIComponent(person)}` : ""}`,
        signal,
      ),
  });
}

/* --------------------------- dashboard-only writes -------------------------- */

function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["finance"] });
}

export function useCreateFinanceEntry() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (input: FinanceEntryInput) =>
      apiFetch<FinanceEntry>("/finance/entries", {
        method: "POST",
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateFinanceEntry() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FinanceEntryInput }) =>
      apiFetch<FinanceEntry>(`/finance/entries/${id}`, {
        method: "PUT",
        body: input,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteFinanceEntry() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/finance/entries/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
