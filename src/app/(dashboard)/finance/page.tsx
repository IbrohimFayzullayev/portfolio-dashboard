"use client";

import { FinanceOverview } from "@/components/finance/overview";
import {
  FinanceSourceProvider,
  adminFinanceSource,
} from "@/lib/finance/source";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hisob-kitob</h1>
        <p className="text-muted-foreground text-sm">
          Botga yozilgan xarajatlar, berilganlar va qarzlar. Bu yerda tuzatish
          mumkin.
        </p>
      </div>
      <FinanceSourceProvider source={adminFinanceSource}>
        <FinanceOverview />
      </FinanceSourceProvider>
    </div>
  );
}
