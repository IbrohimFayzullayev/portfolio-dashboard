import type { Metadata, Viewport } from "next";

import { TelegramSessionProvider } from "@/lib/telegram";

/*
 * The Telegram Mini App. Deliberately outside the (dashboard) route group: no
 * admin login check, no sidebar, no admin session at all (see providers.tsx).
 * Everything under /tg signs in with Telegram's init data and reads only.
 */

export const metadata: Metadata = {
  title: "Hisobotlar",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function TelegramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TelegramSessionProvider>{children}</TelegramSessionProvider>;
}
