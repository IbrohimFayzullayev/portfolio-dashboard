/**
 * The money log, as the API returns it (internal/api/finance_handler.go).
 *
 * Every amount is in minor units (hundredths) per currency: { UZS: 3500000 }
 * is 35 000 so'm. Dates are "YYYY-MM-DD" in Tashkent time, never instants, so
 * nothing here should ever pass them through `new Date()` and a time zone.
 */

export type Currency = "UZS" | "USD";

export type Amounts = Partial<Record<Currency, number>>;

export type FinanceKindKey =
  | "expense"
  | "gift"
  | "lent"
  | "repaid_in"
  | "borrowed"
  | "repaid_out"
  | "income";

export interface FinanceKind {
  key: FinanceKindKey;
  emoji: string;
  label: string;
  /** Moves a person's balance. */
  debt: boolean;
  /** Counts as "spent": money that left and is not coming back. */
  spending: boolean;
  /** Effect on the money in hand: +1 in, -1 out. */
  cash: 1 | -1;
}

export interface FinanceCategory {
  key: string;
  emoji: string;
  label: string;
}

export interface FinanceMeta {
  kinds: FinanceKind[];
  /** Spending categories, plus "qarz" for debt rows. */
  categories: FinanceCategory[];
  /** Where income comes from: a separate list, never mixed with spending. */
  income_categories: FinanceCategory[];
  currencies: Currency[];
  /** Today in Tashkent, from the server's clock. */
  today: string;
}

export interface FinanceEntry {
  id: string;
  kind: FinanceKindKey;
  amount_minor: number;
  currency: Currency;
  category: string;
  person: string;
  note: string;
  /** Exactly what was typed to the bot; empty for rows made here. */
  raw_text: string;
  spent_on: string;
  source: "bot" | "admin";
  created_at: string;
  updated_at: string;
}

export interface FinanceEntryList {
  entries: FinanceEntry[];
  total: number;
}

export interface FinanceEntryInput {
  kind: FinanceKindKey;
  amount_minor: number;
  currency: Currency;
  category: string;
  person: string;
  note: string;
  spent_on: string;
}

export interface FinanceDebt {
  person: string;
  currency: Currency;
  /** Positive: they owe me. Negative: I owe them. */
  amount_minor: number;
  /** When this balance was opened. */
  since: string;
}

export interface FinanceDebts {
  balances: FinanceDebt[];
  owed_to_me: Amounts;
  i_owe: Amounts;
  people: number;
}

export interface FinanceSummary {
  from: string;
  to: string;
  days: number;
  spent: Amounts;
  income: Amounts;
  /** income - spent: what was kept. */
  net: Amounts;
  balance: FinanceBalance;
  /** End-of-day balance in so'm; null before the first checkpoint. */
  balance_series: { date: string; amount_minor: number | null }[];
  by_kind: Partial<Record<FinanceKindKey, { amounts: Amounts; count: number }>>;
  by_category: { category: string; amounts: Amounts; count: number }[];
  by_day: { date: string; amounts: Amounts }[];
  /** Twelve months; `amounts` is spent, `income` is income. */
  by_month: { month: string; amounts: Amounts; income: Amounts }[];
  gifts_by_person: { person: string; amounts: Amounts; count: number }[];
  largest: FinanceEntry[];
  compare: { from: string; to: string; spent: Amounts } | null;
  debts: FinanceDebts;
}

export interface FinanceEntryFilter {
  from?: string;
  to?: string;
  kind?: string;
  category?: string;
  person?: string;
  q?: string;
  limit?: number;
}

export interface FinanceCheckpoint {
  id: string;
  currency: Currency;
  amount_minor: number;
  taken_at: string;
  /** What the rows said just before; null for the first one. */
  computed_minor: number | null;
  note: string;
}

export interface FinanceBalance {
  /** One per currency ever counted; empty until the first checkpoint. */
  balances: {
    currency: Currency;
    amount_minor: number;
    checkpoint: FinanceCheckpoint;
    in: number;
    out: number;
  }[];
  in_hand: Amounts;
  /** In hand + owed to me - what I owe. */
  net_worth: Amounts;
}

export interface FinanceCheckpointInput {
  currency: Currency;
  amount_minor: number;
  /** "YYYY-MM-DD" for the start of a past day, or "" for now. */
  date: string;
  note: string;
}
