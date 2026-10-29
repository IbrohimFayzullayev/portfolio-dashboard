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

/**
 * The finance bot's Mini App: one person's money - charts, categories,
 * debts, balance and every entry, editable. The same components as the
 * dashboard's /finance page, pointed at the finance bot's API by the source
 * below.
 */
export default function FinbotPage() {
  const session = useTelegramSession();

  const source = React.useMemo<FinanceSource>(
    () => ({
      id: "finbot",
      get: session.get,
      send: (path, { method, body }) => session.send(path, { method, body }),
      canEdit: true,
    }),
    [session],
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
          Botda chap pastdagi &quot;Hisobot&quot; tugmasini bosing yoki /app
          yozing.
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
        <p className="font-medium">Hali ruxsat yo&apos;q.</p>
        <p className="text-muted-foreground text-sm">
          Botda /start bosing yoki sizga yuborilgan taklif havolasini oching.
        </p>
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
    <FinanceSourceProvider source={source}>
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4 pb-10">
        <h1 className="text-lg font-semibold tracking-tight">
          👛 Hamyon
          {session.firstName && (
            <span className="text-muted-foreground font-normal">
              {" "}
              · {session.firstName}
            </span>
          )}
        </h1>
        <FinanceOverview allowCustomRange={false} />
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
