"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/**
 * Error boundary for the dashboard pages. Reports the error to the API's
 * browser-error intake — the same grouped list the System page shows and the
 * bot announces — and offers a retry.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Fire-and-forget: this page has already failed, and there is nothing to
    // do with the news that reporting failed as well.
    void fetch(`${API_URL}/public/client-errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        source: "dashboard",
        message: error.message ?? "",
        stack: (error.stack ?? "").slice(0, 4000),
        digest: error.digest ?? "",
        path: window.location.pathname,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          This page failed to load
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          The error has been reported. {error.message}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
