"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Activity,
  BookOpen,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Mail,
  Loader2,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useContactMessages } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/posts", label: "Posts", icon: FileText, exact: false },
  { href: "/projects", label: "Projects", icon: FolderKanban, exact: false },
  { href: "/finance", label: "Finance", icon: Wallet, exact: false },
  { href: "/finbot", label: "Moliya boti", icon: Users, exact: false },
  { href: "/growth", label: "Growth", icon: TrendingUp, exact: false },
  { href: "/notes", label: "Notes", icon: BookOpen, exact: false },
  { href: "/invitations", label: "Invitations", icon: Mail, exact: false },
  { href: "/messages", label: "Messages", icon: Inbox, exact: false },
  { href: "/system", label: "System", icon: Activity, exact: false },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Fetched here rather than on the page so the count is visible from
  // anywhere in the dashboard; React Query shares the result with the page.
  // Held back until there is a session — asking earlier is a guaranteed 401.
  const unread =
    useContactMessages({ enabled: Boolean(user) }).data?.unread ?? 0;

  React.useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="grid min-h-dvh md:grid-cols-[260px_1fr]">
      <aside className="bg-card hidden flex-col border-r md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold tracking-tight">
          <LayoutDashboard className="size-5" />
          Dashboard
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
                {item.href === "/messages" && unread > 0 && (
                  <span
                    className="bg-foreground text-background ml-auto rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums"
                    aria-label={`${unread} unread`}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="bg-background/80 flex h-16 items-center justify-between gap-4 border-b px-6 backdrop-blur">
          {/* Nine links do not fit a phone; they scroll sideways instead of
              pushing the sign-out button off the screen. */}
          <nav className="-mx-2 flex min-w-0 items-center gap-1 overflow-x-auto px-2 md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 text-sm",
                  isActive(item.href, item.exact)
                    ? "bg-secondary"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-none font-medium">
                {user.name || "Admin"}
              </p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
