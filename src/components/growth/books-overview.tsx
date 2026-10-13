"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  daysBetween,
  formatDay,
  formatMonth,
  formatMonthShort,
  localToday,
} from "@/lib/finance/format";
import { axisMinutes, formatMinutes } from "@/lib/growth/format";
import { useBooks } from "@/lib/growth/hooks";
import type { Book, BooksSummary } from "@/lib/growth/types";
import { BarChart, type Bar } from "@/components/finance/bar-chart";
import { Section } from "@/components/finance/parts";
import { Failure, Loading } from "./growth-overview";

/**
 * Books read for pleasure: which ones, which days, how long. Kept apart from
 * the English page on purpose — a novel is rest, not practice.
 */
export function BooksOverview() {
  const thisYear = Number(localToday().slice(0, 4));
  const [year, setYear] = React.useState(thisYear);
  const books = useBooks(year);

  if (books.isLoading && !books.data) return <Loading />;
  if (books.error || !books.data) return <Failure error={books.error} />;
  const b = books.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Oldingi yil"
            onClick={() => setYear((y) => y - 1)}
            className="hover:bg-muted rounded-md p-1.5"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="w-12 text-center font-semibold tabular-nums">
            {year}
          </span>
          <button
            type="button"
            aria-label="Keyingi yil"
            disabled={year >= thisYear}
            onClick={() => setYear((y) => y + 1)}
            className="hover:bg-muted rounded-md p-1.5 disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Jami vaqt" value={formatMinutes(b.minutes)} />
        <Tile label="O'qilgan kunlar" value={`${b.days}`} />
        <Tile label="Tugatilgan" value={`${b.finished.length} ta`} />
        <Tile
          label="O'qilgan kunga"
          value={b.days ? formatMinutes(Math.round(b.minutes / b.days)) : "–"}
        />
      </div>

      {year === thisYear && (
        <Section title="Oxirgi 30 kun">
          <BarChart
            bars={recentBars(b)}
            formatValue={(v) => (v ? formatMinutes(v) : "o'qilmagan")}
            formatAxis={axisMinutes}
            idleText={`${b.recent.filter((d) => d.minutes > 0).length} kun o'qildi`}
            ariaLabel="Oxirgi 30 kunda o'qish daqiqalari"
          />
        </Section>
      )}

      <Section title="Oylar bo'yicha">
        <BarChart
          bars={b.by_month.map((m) => ({
            key: m.month,
            value: m.minutes,
            label: `${formatMonth(m.month)} · ${m.days} kun`,
            tick: formatMonthShort(m.month),
          }))}
          formatValue={(v) => formatMinutes(v)}
          formatAxis={axisMinutes}
          idleText={`${year} · ${formatMinutes(b.minutes)}`}
          ariaLabel="Oylar bo'yicha o'qish"
          height={150}
        />
      </Section>

      {b.reading.length > 0 && (
        <Section title="O'qilmoqda">
          <ul className="space-y-4">
            {b.reading.map((bk) => (
              <ReadingBook key={bk.id} book={bk} />
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Tugatilgan · ${b.finished.length}`}>
        {b.finished.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {year} yilda hali tugatilgan kitob yo&apos;q.
          </p>
        ) : (
          <ul className="divide-y">
            {b.finished.map((bk) => (
              <FinishedBook key={bk.id} book={bk} />
            ))}
          </ul>
        )}
        {b.dropped.length > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            Qoldirilgan: {b.dropped.map((bk) => `«${bk.title}»`).join(", ")}
          </p>
        )}
      </Section>

      {b.sessions === 0 && b.reading.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Botda boshlang:{" "}
          <code className="bg-muted rounded px-1">
            /kitob yangi Nomi - Muallif 320 bet
          </code>
        </p>
      )}
    </div>
  );
}

export function recentBars(b: BooksSummary): Bar[] {
  return b.recent.map((d, i) => ({
    key: d.date,
    value: d.minutes,
    label: formatDay(d.date),
    tick: (b.recent.length - 1 - i) % 7 === 0 ? formatDay(d.date) : "",
  }));
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border p-3 shadow-sm">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ReadingBook({ book }: { book: Book }) {
  return (
    <li>
      <p className="text-sm font-medium">
        {book.title}
        {book.author && (
          <span className="text-muted-foreground font-normal">
            {" "}
            — {book.author}
          </span>
        )}
      </p>
      {book.total_pages && book.last_page > 0 ? (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
            <span
              className="bg-foreground block h-full rounded-full"
              style={{ width: `${book.percent}%` }}
            />
          </span>
          <span className="text-xs font-medium tabular-nums">
            {book.percent}%
          </span>
        </div>
      ) : null}
      <p className="text-muted-foreground mt-1 text-xs tabular-nums">
        {formatMinutes(book.minutes)} · {book.days} kun
        {book.last_page > 0 &&
          ` · ${book.last_page}${book.total_pages ? `/${book.total_pages}` : ""} bet`}
        {" · "}
        {formatDay(book.started_on)} dan
      </p>
    </li>
  );
}

function FinishedBook({ book }: { book: Book }) {
  const span = book.finished_on
    ? daysBetween(book.started_on, book.finished_on) + 1
    : 0;
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <p className="text-sm font-medium">
        {book.title}
        {book.author && (
          <span className="text-muted-foreground font-normal">
            {" "}
            — {book.author}
          </span>
        )}
      </p>
      <p className="text-muted-foreground text-xs tabular-nums">
        {book.finished_on && formatDay(book.finished_on)} · {span} kunda ·{" "}
        {formatMinutes(book.minutes)} · {book.days} kun o&apos;qildi
        {book.total_pages ? ` · ${book.total_pages} bet` : ""}
      </p>
    </li>
  );
}
