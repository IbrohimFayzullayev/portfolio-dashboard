import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useFinanceSource } from "@/lib/finance/source";
import type { BooksSummary, GrowthSummary, Note, NoteMeta } from "./types";

/* Reads only, through the page's data source (admin session in the dashboard,
 * viewer token in the Mini App — see lib/finance/source.tsx; the source is not
 * money-specific, only its name is). Keys start with the source id so the two
 * credentials never share a cache entry. */

export function useGrowthSummary(range: { from: string; to: string } | null) {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["growth", src.id, "summary", range],
    queryFn: ({ signal }) => {
      const qs = range ? `?${new URLSearchParams(range)}` : "";
      return src.get<GrowthSummary>(`/growth/summary${qs}`, signal);
    },
    placeholderData: keepPreviousData,
  });
}

export function useBooks(year: number) {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["growth", src.id, "books", year],
    queryFn: ({ signal }) =>
      src.get<BooksSummary>(`/growth/books?year=${year}`, signal),
    placeholderData: keepPreviousData,
  });
}

export function useNotes() {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["notes", src.id, "list"],
    queryFn: ({ signal }) =>
      src.get<{ notes: NoteMeta[] }>("/notes", signal).then((r) => r.notes),
    staleTime: 10 * 60 * 1000,
  });
}

export function useNote(slug: string | null) {
  const src = useFinanceSource();
  return useQuery({
    queryKey: ["notes", src.id, "note", slug],
    queryFn: ({ signal }) => src.get<Note>(`/notes/${slug}`, signal),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
