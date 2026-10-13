"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FinanceOverview } from "@/components/finance/overview";
import {
  FinanceSourceProvider,
  type FinanceSource,
} from "@/lib/finance/source";
import { useTelegramSession } from "@/lib/telegram";

export default function TelegramFinancePage() {
  const session = useTelegramSession();

  const source = React.useMemo<FinanceSource>(
    () => ({ id: "tg", get: session.get, canEdit: false }),
    [session.get],
  );

  if (session.status === "loading") {
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

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4 pb-10">
      <h1 className="text-lg font-semibold tracking-tight">
        Hisob-kitob
        {session.firstName && (
          <span className="text-muted-foreground font-normal">
            {" "}
            · {session.firstName}
          </span>
        )}
      </h1>
      <FinanceSourceProvider source={source}>
        <FinanceOverview allowCustomRange={false} />
      </FinanceSourceProvider>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      {children}
    </div>
  );
}
