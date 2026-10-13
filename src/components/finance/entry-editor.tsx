"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useCreateFinanceEntry,
  useUpdateFinanceEntry,
} from "@/lib/finance/hooks";
import { amountInputValue, parseAmountInput } from "@/lib/finance/format";
import type {
  Currency,
  FinanceCategory,
  FinanceEntry,
  FinanceEntryInput,
  FinanceKind,
  FinanceKindKey,
} from "@/lib/finance/types";

/**
 * Create or correct one entry. The rules mirror the API's: debt kinds always
 * sit in "qarz" and need a name; everything else picks a real category.
 */
export function EntryEditor({
  entry,
  kinds,
  categories,
  incomeCategories,
  today,
  onClose,
}: {
  entry: FinanceEntry | null;
  kinds: FinanceKind[];
  categories: FinanceCategory[];
  incomeCategories: FinanceCategory[];
  today: string;
  onClose: () => void;
}) {
  const create = useCreateFinanceEntry();
  const update = useUpdateFinanceEntry();
  const pending = create.isPending || update.isPending;

  const [kind, setKind] = React.useState<FinanceKindKey>(
    entry?.kind ?? "expense",
  );
  const [amount, setAmount] = React.useState(
    entry ? amountInputValue(entry.amount_minor) : "",
  );
  const [currency, setCurrency] = React.useState<Currency>(
    entry?.currency ?? "UZS",
  );
  const [category, setCategory] = React.useState(
    entry && entry.category !== "qarz" ? entry.category : "boshqa",
  );
  const [person, setPerson] = React.useState(entry?.person ?? "");
  const [note, setNote] = React.useState(entry?.note ?? "");
  const [spentOn, setSpentOn] = React.useState(entry?.spent_on ?? today);
  const [problem, setProblem] = React.useState("");

  const isDebt = kinds.find((k) => k.key === kind)?.debt ?? false;
  const isIncome = kind === "income";
  const choosable = React.useMemo(
    () =>
      isIncome ? incomeCategories : categories.filter((c) => c.key !== "qarz"),
    [isIncome, incomeCategories, categories],
  );

  // Switching kind can leave a category that no longer fits (a lunch filed
  // under "Oylik"); move to the list's last entry, its "other".
  React.useEffect(() => {
    if (!isDebt && !choosable.some((c) => c.key === category)) {
      setCategory(choosable[choosable.length - 1]?.key ?? "boshqa");
    }
  }, [isDebt, choosable, category]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const minor = parseAmountInput(amount);
    if (minor === null)
      return setProblem("Summani tushunmadim: 35000, 35k yoki 1.5 mln");
    if (isDebt && !person.trim())
      return setProblem("Qarz uchun kimligini yozing");
    if (!spentOn) return setProblem("Sanani tanlang");
    setProblem("");

    const input: FinanceEntryInput = {
      kind,
      amount_minor: minor,
      currency,
      category: isDebt ? "qarz" : category,
      person: person.trim(),
      note: note.trim(),
      spent_on: spentOn,
    };
    try {
      if (entry) await update.mutateAsync({ id: entry.id, input });
      else await create.mutateAsync(input);
      toast.success(entry ? "Saqlandi" : "Qo'shildi");
      onClose();
    } catch (err) {
      setProblem(err instanceof ApiError ? err.message : "Saqlab bo'lmadi");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-editor-title"
        className="bg-card max-h-[92dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl border p-5 shadow-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="entry-editor-title" className="font-semibold">
            {entry ? "Yozuvni tahrirlash" : "Yangi yozuv"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X />
          </Button>
        </div>

        {entry?.raw_text && (
          <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-xs">
            Botga yozilgan:{" "}
            <span className="text-foreground">{entry.raw_text}</span>
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="fe-kind">Turi</Label>
          <Select
            id="fe-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as FinanceKindKey)}
          >
            {kinds.map((k) => (
              <option key={k.key} value={k.key}>
                {k.emoji} {k.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fe-amount">Summa</Label>
            <Input
              id="fe-amount"
              inputMode="decimal"
              autoFocus={!entry}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="35000 yoki 35k"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fe-currency">Valyuta</Label>
            <Select
              id="fe-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <option value="UZS">so&apos;m</option>
              <option value="USD">$</option>
            </Select>
          </div>
        </div>

        {!isDebt && (
          <div className="space-y-1.5">
            <Label htmlFor="fe-category">Kategoriya</Label>
            <Select
              id="fe-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {choosable.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="fe-person">
            {isIncome ? "Kimdan" : "Kim"}
            {isDebt ? "" : " (ixtiyoriy)"}
          </Label>
          <Input
            id="fe-person"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Ali"
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fe-note">Izoh</Label>
          <Input
            id="fe-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="tushlik"
            maxLength={500}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fe-date">Sana</Label>
          <Input
            id="fe-date"
            type="date"
            value={spentOn}
            max={today}
            onChange={(e) => setSpentOn(e.target.value)}
          />
        </div>

        {problem && <p className="text-destructive text-sm">{problem}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Saqlash
          </Button>
        </div>
      </form>
    </div>
  );
}
