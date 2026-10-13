"use client";

import { NotesView } from "@/components/notes/notes-view";
import {
  FinanceSourceProvider,
  adminFinanceSource,
} from "@/lib/finance/source";

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground text-sm">
          Reja, manbalar va bot qo&apos;llanmasi. Telegram&apos;da: /hujjat.
        </p>
      </div>
      <FinanceSourceProvider source={adminFinanceSource}>
        <NotesView />
      </FinanceSourceProvider>
    </div>
  );
}
