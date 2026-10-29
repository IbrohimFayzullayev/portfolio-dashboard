"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FinanceOverview } from "@/components/finance/overview";
import { GrowthOverview } from "@/components/growth/growth-overview";
import { BooksOverview } from "@/components/growth/books-overview";
import { NotesView } from "@/components/notes/notes-view";
import { cn } from "@/lib/utils";
import { parseTab, type Tab } from "@/lib/growth/format";
import {
  FinanceSourceProvider,
  readOnlySend,
  type FinanceSource,
} from "@/lib/finance/source";
import { useTelegramSession } from "@/lib/telegram";

const TAB_LABELS: { tab: Tab; label: string; title: string }[] = [
  { tab: "money", label: "💰 Pul", title: "Hisob-kitob" },
  { tab: "growth", label: "📈 O'sish", title: "Ingliz tili" },
  { tab: "books", label: "📚 Kitoblar", title: "Kitoblar" },
  { tab: "notes", label: "📄 Hujjatlar", title: "Hujjatlar" },
];

/**
 * The Mini App: money, English sprints, books and the personal notes, one tab
 * each. The bot opens it on a given tab with ?tab=…&doc=… (see
 * internal/bot/notes.go); switching tabs rewrites the URL in place, so a
 * reload stays where you were.
 */
export default function TelegramPage() {
  const session = useTelegramSession();
  const [view, setView] = React.useState<{ tab: Tab; doc: string } | null>(
    null,
  );

  // The URL is only readable in the browser; until then nothing is shown,
  // so the money tab never flashes before a deep link to a document.
  React.useEffect(() => {
    setView(parseTab(window.location.search));
  }, []);

  const go = React.useCallback((tab: Tab, doc = "") => {
    setView({ tab, doc });
    const q = new URLSearchParams({ tab });
    if (doc) q.set("doc", doc);
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, []);

  const source = React.useMemo<FinanceSource>(
    () => ({
      id: "tg",
      get: session.get,
      send: readOnlySend,
      canEdit: false,
    }),
    [session.get],
  );

  if (session.status === "loading" || !view) {
    return (
      <Centered>
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </Centered>
    );
  }
  if (session.status === "outside") {
    return (
      <Centered>
        <p className="font-medium">Bu sahifa Telegram ichida ochiladi.</p>
        <p className="text-muted-foreground text-sm">
          Botda /app yoki /hisob yozing va &quot;Grafiklarni ochish&quot;
          tugmasini bosing.
        </p>
        <Button variant="outline" size="sm" onClick={session.retry}>
          Qayta urinish
        </Button>
      </Centered>
    );
  }
  if (session.status === "denied") {
    return (
      <Centered>
        <p className="font-medium">Bu Telegram hisobiga ruxsat yo&apos;q.</p>
      </Centered>
    );
  }
  if (session.status === "error") {
    return (
      <Centered>
        <p className="font-medium">Kirib bo&apos;lmadi</p>
        <p className="text-muted-foreground text-sm">{session.error}</p>
        <Button variant="outline" size="sm" onClick={session.retry}>
          Qayta urinish
        </Button>
      </Centered>
    );
  }

  const current = TAB_LABELS.find((t) => t.tab === view.tab)!;

  return (
    <FinanceSourceProvider source={source}>
      <nav className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-3 py-2">
          {TAB_LABELS.map((t) => (
            <button
              key={t.tab}
              type="button"
              onClick={() => go(t.tab)}
              aria-pressed={view.tab === t.tab}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                view.tab === t.tab
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4 pb-10">
        <h1 className="text-lg font-semibold tracking-tight">
          {current.title}
          {session.firstName && view.tab === "money" && (
            <span className="text-muted-foreground font-normal">
              {" "}
              · {session.firstName}
            </span>
          )}
        </h1>
        {view.tab === "money" && <FinanceOverview allowCustomRange={false} />}
        {view.tab === "growth" && <GrowthOverview />}
        {view.tab === "books" && <BooksOverview />}
        {view.tab === "notes" && (
          <NotesView
            key={view.doc}
            initialSlug={view.doc}
            onOpen={(slug) => go("notes", slug)}
          />
        )}
      </main>
    </FinanceSourceProvider>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      {children}
    </div>
  );
}
