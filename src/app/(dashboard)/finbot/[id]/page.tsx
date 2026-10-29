"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { ApiError, apiFetch } from "@/lib/api";
import {
  ago,
  failureRate,
  finbotName,
  joinedVia,
  shortDate,
  useFinbotUser,
} from "@/lib/finbot-admin";
import {
  FinanceSourceProvider,
  readOnlySend,
  type FinanceSource,
} from "@/lib/finance/source";
import { FinanceOverview } from "@/components/finance/overview";
import { Badge } from "@/components/ui/badge";

const REASON: Record<string, string> = {
  no_amount: "summa yo'q",
  no_person: "ism yo'q",
  other: "boshqa",
};

/**
 * One finance-bot user's report, exactly as they see it in their Mini App,
 * read-only. Above it: how they get on with the bot, and the messages it
 * could not read - the parser's to-do list.
 */
export default function FinbotUserPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading, isError, error } = useFinbotUser(id);

  const source = React.useMemo<FinanceSource>(
    () => ({
      id: `finbot-admin:${id}`,
      get: (path, signal) => apiFetch(`/finbot/users/${id}${path}`, { signal }),
      send: readOnlySend,
      canEdit: false,
    }),
    [id],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof ApiError
          ? error.message
          : "Ma'lumotni yuklab bo'lmadi"}
      </p>
    );
  }

  const u = data.user;
  const rate = failureRate(u);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/finbot"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Moliya boti
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{finbotName(u)}</h1>
          <Badge variant={u.status === "active" ? "success" : "muted"}>
            {u.status === "active"
              ? "Faol"
              : u.status === "pending"
                ? "Kutmoqda"
                : "Bloklangan"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Telegram ID {u.telegram_id} · start {shortDate(u.created_at)} ·{" "}
          {joinedVia(u.joined_via)}
          {u.last_seen_at && ` · oxirgi marta ${ago(u.last_seen_at)}`} ·
          ertalabki xulosa {u.daily_summary ? "yoqilgan" : "o'chirilgan"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="Yozuvlar"
          value={`${u.entries}`}
          hint={`30 kunda ${u.entries_30d}`}
        />
        <Tile
          label="Faol kunlar (30)"
          value={`${u.active_days_30}`}
          hint={
            u.last_entry_at
              ? `oxirgi yozuv ${ago(u.last_entry_at)}`
              : "hali yozmagan"
          }
        />
        <Tile
          label="Bot tushunmagan"
          value={rate === null ? "-" : `${rate}%`}
          hint={`30 kunda ${u.failures_30d} ta xabar`}
        />
        <Tile
          label="Tuzatilgan yozuvlar"
          value={`${u.corrected}`}
          hint={`balans tekshiruvi ${u.checkpoints}`}
        />
      </div>

      {data.failures.length > 0 && (
        <section className="bg-card space-y-2 rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold">Bot tushunmagan xabarlar</h2>
          <p className="text-muted-foreground text-xs">
            {
              "Bu xabarlar yozilmagan. Odatda summa yo'q yoki qarzda ism qo'shimchasiz yozilgan. Ko'p takrorlansa, parserga shu shaklni o'rgatish kerak."
            }
          </p>
          <ul className="divide-y text-sm">
            {data.failures.map((f, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2">
                <span className="text-muted-foreground w-28 shrink-0 text-xs tabular-nums">
                  {ago(f.created_at)}
                </span>
                <code className="bg-muted min-w-0 flex-1 truncate rounded px-1.5 py-0.5">
                  {f.text}
                </code>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {REASON[f.reason] ?? f.reason}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.money_visible ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold">Hisobot</h2>
            <p className="text-muted-foreground text-xs">
              Foydalanuvchi o&apos;z Mini App&apos;ida ko&apos;radigan
              hisobotning o&apos;zi. Faqat ko&apos;rish: yozuvlarni egasining
              o&apos;zi tuzatadi.
            </p>
          </div>
          <FinanceSourceProvider source={source}>
            <FinanceOverview />
          </FinanceSourceProvider>
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">
          Summalar adminga ko&apos;rsatilmaydi (FINBOT_ADMIN_SEES_MONEY=false).
        </p>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}
