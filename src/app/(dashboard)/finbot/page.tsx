"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatAmounts, formatMoney } from "@/lib/finance/format";
import {
  ago,
  failureRate,
  finbotName,
  joinedVia,
  shortDate,
  useFinbotUsers,
  useSetFinbotStatus,
  type FinbotStatus,
  type FinbotUser,
} from "@/lib/finbot-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * The finance bot's people: everyone who pressed /start, who is let in, who
 * uses it and how well. Each row opens that person's full report.
 */
export default function FinbotUsersPage() {
  const { data, isLoading, isError, error } = useFinbotUsers();
  const [filter, setFilter] = React.useState<FinbotStatus | "all">("all");

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Moliya boti</h1>
        <p className="text-destructive text-sm">
          {error instanceof ApiError
            ? error.message
            : "Ma'lumotni yuklab bo'lmadi"}
        </p>
      </div>
    );
  }

  const { counts } = data;
  const users =
    filter === "all"
      ? data.users
      : data.users.filter((u) => u.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moliya boti</h1>
        <p className="text-muted-foreground text-sm">
          {data.bot_username ? `@${data.bot_username} · ` : ""}
          /start bosgan hamma va ular botdan qanday foydalanayotgani.
          {!data.money_visible && " Summalar yashirilgan."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Counter label="Start bosgan" value={counts.total} />
        <Counter label="Faol (ruxsatli)" value={counts.active} />
        <Counter label="7 kunda yozgan" value={counts.active_7d} />
        <Counter
          label="Kutmoqda"
          value={counts.pending}
          highlight={counts.pending > 0}
        />
        <Counter label="Bloklangan" value={counts.blocked} />
      </div>

      <div
        className="bg-muted flex w-fit flex-wrap gap-1 rounded-lg p-1"
        role="group"
        aria-label="Holat"
      >
        {(
          [
            ["all", "Hammasi"],
            ["active", "Faol"],
            ["pending", "Kutmoqda"],
            ["blocked", "Bloklangan"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              filter === key
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {data.users.length === 0
            ? "Hali hech kim /start bosmagan. Botda /taklif yozib, do'stingizga havola yuboring."
            : "Bu holatda hech kim yo'q."}
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Counter({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 shadow-sm",
        highlight && "border-amber-500/60",
      )}
    >
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

const STATUS: Record<
  FinbotStatus,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  active: { label: "Faol", variant: "success" },
  pending: { label: "Kutmoqda", variant: "warning" },
  blocked: { label: "Bloklangan", variant: "muted" },
};

function UserRow({ user: u }: { user: FinbotUser }) {
  const setStatus = useSetFinbotStatus();
  const rate = failureRate(u);

  async function change(status: "active" | "blocked") {
    if (
      status === "blocked" &&
      !confirm(`${finbotName(u)} bloklansinmi? Bot unga javob bermay qo'yadi.`)
    )
      return;
    try {
      const res = await setStatus.mutateAsync({ id: u.id, status });
      toast.success(res.notice);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "O'zgartirib bo'lmadi",
      );
    }
  }

  return (
    <li className="bg-card rounded-xl border shadow-sm">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{finbotName(u)}</span>
            <Badge variant={STATUS[u.status].variant}>
              {STATUS[u.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            ID {u.telegram_id} · start {shortDate(u.created_at)} ·{" "}
            {joinedVia(u.joined_via)}
            {u.last_seen_at && ` · oxirgi marta ${ago(u.last_seen_at)}`}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {u.status !== "active" && (
            <Button
              size="sm"
              onClick={() => change("active")}
              disabled={setStatus.isPending}
            >
              Ruxsat berish
            </Button>
          )}
          {u.status !== "blocked" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => change("blocked")}
              disabled={setStatus.isPending}
            >
              {u.status === "pending" ? "Rad etish" : "Bloklash"}
            </Button>
          )}
        </div>
      </div>

      {u.status === "active" && (
        <Link
          href={`/finbot/${u.id}`}
          className="hover:bg-muted/50 flex items-center gap-4 border-t px-4 py-3 text-sm transition-colors"
        >
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 xl:grid-cols-6">
            <Stat
              label="Yozuvlar"
              value={`${u.entries}`}
              hint={`7 kunda ${u.entries_7d}`}
            />
            <Stat
              label="Faol kunlar (30)"
              value={`${u.active_days_30}`}
              hint={u.last_entry_at ? `oxirgi ${ago(u.last_entry_at)}` : "-"}
            />
            <Stat
              label="Tushunilmagan"
              value={rate === null ? "-" : `${rate}%`}
              hint={`${u.failures_30d} ta · tuzatilgan ${u.corrected}`}
              warn={rate !== null && rate >= 20}
            />
            {u.money ? (
              <Stat
                label="Shu oy sarf"
                value={formatAmounts(u.money.month_spent)}
                hint={`kirim ${formatAmounts(u.money.month_income)}`}
              />
            ) : (
              <Stat
                label="Balans tekshiruvi"
                value={`${u.checkpoints}`}
                hint={u.checkpoints ? "bor" : "boshlanmagan"}
                warn={u.checkpoints === 0}
              />
            )}
            {u.money && (
              <>
                <Stat
                  label="Qo'lida"
                  value={u.money.in_hand ? formatAmounts(u.money.in_hand) : "-"}
                  hint={
                    u.money.in_hand
                      ? `${u.checkpoints} ta tekshiruv`
                      : "/balans yozmagan"
                  }
                  warn={!u.money.in_hand}
                />
                <Stat
                  label="Oxirgi farq"
                  value={
                    u.money.last_gap_minor === null
                      ? "-"
                      : formatMoney(u.money.last_gap_minor)
                  }
                  hint="yozilmay qolgan pul"
                  warn={
                    u.money.last_gap_minor !== null &&
                    Math.abs(u.money.last_gap_minor) >= 50_000_00
                  }
                />
              </>
            )}
          </dl>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        </Link>
      )}
    </li>
  );
}

function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className={cn(
          "font-medium tabular-nums",
          warn && "text-amber-700 dark:text-amber-400",
        )}
      >
        {value}
      </dd>
      {hint && (
        <dd className="text-muted-foreground truncate text-xs">{hint}</dd>
      )}
    </div>
  );
}
