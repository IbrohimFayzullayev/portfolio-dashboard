"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  // The Telegram Mini App (/tg) has no admin session and must never ask for
  // one: it signs in with Telegram instead (lib/telegram.tsx). Keeping the
  // admin AuthProvider out of that tree means no /auth/me request, and no
  // admin cookie sent, from inside Telegram.
  const isTelegramApp = usePathname()?.startsWith("/tg") ?? false;
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {isTelegramApp ? children : <AuthProvider>{children}</AuthProvider>}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
