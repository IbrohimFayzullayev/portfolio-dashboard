"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFinanceSource } from "@/lib/finance/source";
import { useDeleteFinanceEntry, useFinanceEntries } from "@/lib/finance/hooks";
import { formatDay, formatMoney } from "@/lib/finance/format";
import type {
  FinanceCategory,
  FinanceEntry,
  FinanceEntryFilter,
  FinanceKind,
} from "@/lib/finance/types";
import { EntryEditor } from "./entry-editor";

const PAGE = 50;

export interface EntriesFilterState {
  kind: string;
  category: string;
  person: string;
  q: string;
}

export const emptyFilter: EntriesFilterState = {
  kind: "",
  category: "",
  person: "",
  q: "",
};

/**
 * Every row in the period, newest first, with filters. In the dashboard each
 * row can be edited or deleted; in the Mini App the same list is read-only.
 */
export function EntriesList({
  from,
  to,
  kinds,
  categories,
  incomeCategories,
  filter,
  onFilterChange,
  today,
}: {
  from: string;
  to: string;
  kinds: FinanceKind[];
  categories: FinanceCategory[];
  incomeCategories: FinanceCategory[];
  filter: EntriesFilterState;
  onFilterChange: (f: EntriesFilterState) => void;
  today: string;
}) {
  const { canEdit } = useFinanceSource();
  const [limit, setLimit] = React.useState(PAGE);
  const [search, setSearch] = React.useState(filter.q);
  const [editing, setEditing] = React.useState<FinanceEntry | "new" | null>(
    null,
  );
  const del = useDeleteFinanceEntry();

  // Typing should not fire a request per keystroke.
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (search !== filter.q) onFilterChange({ ...filter, q: search });
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, filter, onFilterChange]);
  React.useEffect(() => setSearch(filter.q), [filter.q]);
  React.useEffect(() => setLimit(PAGE), [from, to, filter]);

  // Looking at one person's history means all of it, not just this period.
  const query: FinanceEntryFilter = {
    ...(filter.person ? {} : { from, to }),
    kind: filter.kind || undefined,
    category: filter.category || undefined,
    person: filter.person || undefined,
    q: filter.q || undefined,
    limit,
  };
  const { data, isLoading, isError, error, isFetching } =
    useFinanceEntries(query);

  const kindMap = React.useMemo(
    () => new Map(kinds.map((k) => [k.key, k])),
    [kinds],
  );
  const catMap = React.useMemo(
    () => new Map([...categories, ...incomeCategories].map((c) => [c.key, c])),
    [categories, incomeCategories],
  );
  const thisYear = Number(today.slice(0, 4));

  async function onDelete(e: FinanceEntry) {
    const what = `${formatMoney(e.amount_minor, e.currency)}${e.note ? `, ${e.note}` : ""}`;
    if (!confirm(`O'chirilsinmi? ${what}`)) return;
    try {
      await del.mutateAsync(e.id);
      toast.success("O'chirildi");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
    }
  }

  const active = Boolean(
    filter.kind || filter.category || filter.person || filter.q,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <div className="relative col-span-2 min-w-40 sm:flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish: izoh, ism, matn"
            className="pl-9"
            aria-label="Qidirish"
          />
        </div>
        <div className="min-w-0 sm:w-44">
          <Select
            value={filter.kind}
            onChange={(e) =>
              onFilterChange({ ...filter, kind: e.target.value })
            }
            aria-label="Turi"
          >
            <option value="">Hamma turlar</option>
            {kinds.map((k) => (
              <option key={k.key} value={k.key}>
                {k.emoji} {k.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 sm:w-48">
          <Select
            value={filter.category}
            onChange={(e) =>
              onFilterChange({ ...filter, category: e.target.value })
            }
            aria-label="Kategoriya"
          >
            <option value="">Hamma kategoriyalar</option>
            <optgroup label="Sarf">
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Kirim">
              {incomeCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </optgroup>
          </Select>
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => setEditing("new")}
            className="col-span-2 sm:ml-auto"
          >
            <Plus /> Yangi yozuv
          </Button>
        )}
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {filter.person && (
            <Chip onClear={() => onFilterChange({ ...filter, person: "" })}>
              👤 {filter.person} · butun tarix
            </Chip>
          )}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
            onClick={() => {
              setSearch("");
              onFilterChange(emptyFilter);
            }}
          >
            Filtrlarni tozalash
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-24 items-center justify-center">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">
          {error instanceof ApiError ? error.message : "Yuklab bo'lmadi"}
        </p>
      ) : !data || data.entries.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Yozuv topilmadi.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            {data.total} ta yozuv{isFetching && " · yangilanmoqda"}
          </p>
          <ul
            className={cn(
              "divide-y rounded-lg border",
              isFetching && "opacity-70",
            )}
          >
            {data.entries.map((e) => {
              const k = kindMap.get(e.kind);
              const c = catMap.get(e.category);
              const title = e.note || e.person || c?.label || k?.label || "";
              return (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className="w-6 shrink-0 text-center text-lg"
                    aria-hidden
                    title={k?.label}
                  >
                    {k?.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {formatDay(e.spent_on, thisYear)}
                      {" · "}
                      {k?.label}
                      {c && !k?.debt && ` · ${c.emoji} ${c.label}`}
                      {e.person && e.note && (
                        <>
                          {" · "}
                          <button
                            type="button"
                            className="hover:text-foreground underline-offset-2 hover:underline"
                            onClick={() =>
                              onFilterChange({ ...filter, person: e.person })
                            }
                          >
                            {e.person}
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-medium tabular-nums",
                      !k?.spending && "text-muted-foreground",
                    )}
                    title={
                      e.raw_text ? `Botga yozilgan: ${e.raw_text}` : undefined
                    }
                  >
                    {k?.cash === 1 ? "+" : ""}
                    {formatMoney(e.amount_minor, e.currency)}
                  </span>
                  {canEdit && (
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Tahrirlash"
                        onClick={() => setEditing(e)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="O'chirish"
                        onClick={() => onDelete(e)}
                        disabled={del.isPending}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {data.total > data.entries.length && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit((n) => Math.min(500, n + PAGE))}
                disabled={isFetching || limit >= 500}
              >
                Ko&apos;proq ({data.total - data.entries.length})
              </Button>
            </div>
          )}
        </>
      )}

      {canEdit && editing && (
        <EntryEditor
          entry={editing === "new" ? null : editing}
          kinds={kinds}
          categories={categories}
          incomeCategories={incomeCategories}
          today={today}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Chip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="bg-secondary inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs font-medium">
      {children}
      <button
        type="button"
        onClick={onClear}
        className="hover:bg-accent rounded-full p-0.5"
        aria-label="Olib tashlash"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
