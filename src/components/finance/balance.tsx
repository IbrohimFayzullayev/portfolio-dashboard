"use client";

import * as React from "react";
import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFinanceSource } from "@/lib/finance/source";
import {
  useCreateFinanceCheckpoint,
  useDeleteFinanceCheckpoint,
  useFinanceCheckpoints,
} from "@/lib/finance/hooks";
import {
  formatAmounts,
  formatDay,
  formatMoney,
  parseAmountInput,
  signedMoney,
} from "@/lib/finance/format";
import type {
  Currency,
  FinanceBalance,
  FinanceCheckpoint,
} from "@/lib/finance/types";

/**
 * Money in hand: the latest count plus everything since. The page leads with
 * it because it is the question the rest of the page answers ("where did it
 * go?"). A recount ("tekshirish") is how the number stays honest: what the
 * rows said vs what was really there, and the gap shown, not hidden.
 */
export function BalanceCard({ balance }: { balance: FinanceBalance }) {
  const { canEdit } = useFinanceSource();
  const [counting, setCounting] = React.useState(false);
  const [history, setHistory] = React.useState(false);

  const empty = balance.balances.length === 0;
  const owesShown =
    JSON.stringify(balance.net_worth) !== JSON.stringify(balance.in_hand) &&
    !empty;

  return (
    <section className="bg-card rounded-xl border p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">
            Qo&apos;limdagi pul
          </p>
          {empty ? (
            <p className="mt-1 text-sm">
              Hali boshlang&apos;ich summa yo&apos;q.{" "}
              {canEdit ? (
                "Hozir qo'lingizda (karta + naqd) qancha borligini kiriting."
              ) : (
                <>
                  Botda{" "}
                  <code className="bg-muted rounded px-1">/balans 25mln</code>{" "}
                  yozing.
                </>
              )}
            </p>
          ) : (
            <>
              {balance.balances.map((b) => (
                <p
                  key={b.currency}
                  className="mt-1 text-3xl font-semibold tracking-tight tabular-nums"
                >
                  {formatMoney(b.amount_minor, b.currency)}
                </p>
              ))}
              {owesShown && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Qarzlar bilan birga:{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {formatAmounts(balance.net_worth)}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
        {canEdit && (
          <Button
            size="sm"
            variant={empty ? "default" : "outline"}
            onClick={() => setCounting((v) => !v)}
          >
            {empty ? "Boshlang'ich summa" : "Tekshirish"}
          </Button>
        )}
      </div>

      {!empty && (
        <ul className="text-muted-foreground mt-3 space-y-0.5 text-xs">
          {balance.balances.map((b) => (
            <li key={b.currency} className="tabular-nums">
              {b.currency === "USD" ? "Dollar · " : ""}
              Tekshiruv {formatDay(isoDayOf(b.checkpoint.taken_at))}:{" "}
              {formatMoney(b.checkpoint.amount_minor, b.currency)}
              {(b.in > 0 || b.out > 0) && (
                <>
                  {" · shundan beri "}
                  {b.in > 0 && (
                    <span className="text-foreground">
                      {signedMoney(b.in, b.currency)}
                    </span>
                  )}
                  {b.in > 0 && b.out > 0 && " / "}
                  {b.out > 0 && (
                    <span className="text-foreground">
                      {signedMoney(-b.out, b.currency)}
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && counting && (
        <CheckpointForm first={empty} onDone={() => setCounting(false)} />
      )}

      {!empty && (
        <div className="mt-3 border-t pt-2">
          <button
            type="button"
            onClick={() => setHistory((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            aria-expanded={history}
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                history && "rotate-180",
              )}
            />
            Tekshiruvlar tarixi
          </button>
          {history && <CheckpointHistory />}
        </div>
      )}
    </section>
  );
}

/** "2026-10-13T07:12:00Z" → the Tashkent calendar day, "2026-10-13". */
function isoDayOf(instant: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(
    new Date(instant),
  );
}

function CheckpointForm({
  first,
  onDone,
}: {
  first: boolean;
  onDone: () => void;
}) {
  const create = useCreateFinanceCheckpoint();
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("UZS");
  const [date, setDate] = React.useState("");
  const [problem, setProblem] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = amount.trim();
    const negative = trimmed.startsWith("-");
    const minor = parseAmountInput(trimmed.replace(/^-/, ""));
    if (minor === null)
      return setProblem("Summani tushunmadim: 25000000, 25 mln yoki 3000");
    try {
      const cp = await create.mutateAsync({
        currency,
        amount_minor: negative ? -minor : minor,
        date,
        note: "",
      });
      if (cp.computed_minor === null) {
        toast.success("Boshlang'ich summa yozildi");
      } else {
        const diff = cp.amount_minor - cp.computed_minor;
        toast.success(
          diff === 0
            ? "Hisob bilan to'liq mos keldi"
            : `Yozildi. Farq: ${signedMoney(diff, cp.currency)} (${diff < 0 ? "yozilmagan xarajat" : "yozilmagan kirim"})`,
        );
      }
      onDone();
    } catch (err) {
      setProblem(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-muted/50 mt-3 space-y-3 rounded-lg p-3"
    >
      <p className="text-sm">
        {first
          ? "Hozir qo'lingizda qancha bor? Shundan keyin har kirim qo'shiladi, har xarajat ayriladi."
          : "Kartadagi va qo'ldagi haqiqiy summani yozing. Hisob bilan farqi ko'rsatiladi."}
      </p>
      <div className="grid grid-cols-[1fr_6rem] gap-2 sm:grid-cols-[1fr_6rem_10rem_auto]">
        <Input
          autoFocus
          inputMode="decimal"
          placeholder="25 mln"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Summa"
        />
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          aria-label="Valyuta"
        >
          <option value="UZS">so&apos;m</option>
          <option value="USD">$</option>
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Qaysi kun boshida (bo'sh: hozir)"
          title="Bo'sh qoldirsangiz: hozir. Sana tanlasangiz: o'sha kun boshidagi summa."
          className="col-span-2 sm:col-span-1"
        />
        <Button
          type="submit"
          disabled={create.isPending}
          className="col-span-2 sm:col-span-1"
        >
          {create.isPending && <Loader2 className="animate-spin" />}
          Saqlash
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Sana bo&apos;sh bo&apos;lsa, hozirgi holat. O&apos;tgan sana
        tanlasangiz, o&apos;sha kun boshidagi summa deb olinadi.
      </p>
      {problem && <p className="text-destructive text-sm">{problem}</p>}
    </form>
  );
}

function CheckpointHistory() {
  const { canEdit } = useFinanceSource();
  const { data, isLoading } = useFinanceCheckpoints();
  const del = useDeleteFinanceCheckpoint();

  if (isLoading)
    return (
      <Loader2 className="text-muted-foreground mt-2 size-4 animate-spin" />
    );
  const list = data?.checkpoints ?? [];
  if (list.length === 0) return null;

  async function onDelete(cp: FinanceCheckpoint) {
    if (
      !confirm(
        `Tekshiruv o'chirilsinmi? ${formatMoney(cp.amount_minor, cp.currency)}`,
      )
    )
      return;
    try {
      await del.mutateAsync(cp.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "O'chirib bo'lmadi");
    }
  }

  return (
    <ul className="mt-2 divide-y text-sm">
      {list.map((cp) => {
        const diff =
          cp.computed_minor === null
            ? null
            : cp.amount_minor - cp.computed_minor;
        return (
          <li key={cp.id} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="tabular-nums">
                {formatMoney(cp.amount_minor, cp.currency)}
                <span className="text-muted-foreground">
                  {" "}
                  · {formatDay(isoDayOf(cp.taken_at))}
                </span>
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {diff === null
                  ? "boshlang'ich summa"
                  : diff === 0
                    ? "hisob bilan mos"
                    : `hisobdagi ${formatMoney(cp.computed_minor!, cp.currency)} · farq ${signedMoney(diff, cp.currency)}`}
              </p>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="O'chirish"
                onClick={() => onDelete(cp)}
                disabled={del.isPending}
              >
                <Trash2 />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
