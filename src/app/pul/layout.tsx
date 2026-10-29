import type { Metadata, Viewport } from "next";

import { TelegramSessionProvider } from "@/lib/telegram";
import { FINBOT_API_URL, FINBOT_AUTH_PATH } from "@/lib/finbot";

/*
 * The finance bot's Mini App. Like /tg it sits outside the (dashboard) route
 * group - no admin login, no sidebar, no admin session (see providers.tsx) -
 * but it talks to a different backend: the finance bot's own API and
 * database, never the portfolio API. Each person sees only their own money.
 */

export const metadata: Metadata = {
  title: "Hisob-kitob",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function FinbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelegramSessionProvider
      apiBase={FINBOT_API_URL}
      authPath={FINBOT_AUTH_PATH}
    >
      {children}
    </TelegramSessionProvider>
  );
}
