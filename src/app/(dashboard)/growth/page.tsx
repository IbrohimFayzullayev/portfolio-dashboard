"use client";

import * as React from "react";

import { BooksOverview } from "@/components/growth/books-overview";
import { GrowthOverview, Segmented } from "@/components/growth/growth-overview";
import {
  FinanceSourceProvider,
  adminFinanceSource,
} from "@/lib/finance/source";

export default function GrowthPage() {
  const [view, setView] = React.useState<"english" | "books">("english");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth</h1>
          <p className="text-muted-foreground text-sm">
            Ingliz tili sprintlari va kitoblar — botga yozilganlar.
          </p>
        </div>
        <Segmented
          value={view}
          options={[
            { value: "english", label: "Ingliz tili" },
            { value: "books", label: "Kitoblar" },
          ]}
          onChange={(v) => setView(v as "english" | "books")}
        />
      </div>
      <FinanceSourceProvider source={adminFinanceSource}>
        {view === "english" ? <GrowthOverview /> : <BooksOverview />}
      </FinanceSourceProvider>
    </div>
  );
}
