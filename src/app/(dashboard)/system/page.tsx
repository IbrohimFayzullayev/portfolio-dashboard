"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { useSystemOverview } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { SystemOverview } from "@/lib/types";
import { formatDateTime, minutesSince, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The same limits the bot itself alerts on, so this page and Telegram never
// disagree about what counts as a problem: bot-watchdog.sh gives the heartbeat
// ten minutes, and the scheduler calls a backup missing after 26 hours.
const BOT_STALE_MINUTES = 10;
const BACKUP_STALE_MINUTES = 26 * 60;

type Tone = "ok" | "warn" | "bad" | "none";

const toneBadge: Record<
  Tone,
  { variant: "success" | "warning" | "default" | "muted"; className?: string }
> = {
  ok: { variant: "success" },
  warn: { variant: "warning" },
  bad: {
    variant: "default",
    className: "bg-destructive text-destructive-foreground",
  },
  none: { variant: "muted" },
};

function StatusBadge({ tone, children }: { tone: Tone; children: string }) {
  const { variant, className } = toneBadge[tone];
  return (
    <Badge variant={variant} className={className}>
      {children}
    </Badge>
  );
}

/** One of the four tiles across the top: a name, a verdict, and the evidence. */
function Tile({
  title,
  tone,
  verdict,
  value,
  detail,
}: {
  title: string;
  tone: Tone;
  verdict: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <StatusBadge tone={tone}>{verdict}</StatusBadge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

function tiles(data: SystemOverview) {
  const { bot, outbox, backup, deploys } = data;

  const botStale = bot ? minutesSince(bot.beat_at) > BOT_STALE_MINUTES : true;
  const backupStale = backup
    ? minutesSince(backup.at) > BACKUP_STALE_MINUTES
    : true;
  const lastDeploy = deploys[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        title="Bot"
        tone={!bot ? "none" : botStale ? "bad" : "ok"}
        verdict={!bot ? "No data" : botStale ? "Silent" : "Alive"}
        value={bot ? timeAgo(bot.beat_at) : "—"}
        detail={
          bot
            ? `Last heartbeat ${formatDateTime(bot.beat_at)}`
            : "The bot has not written a heartbeat yet"
        }
      />
      <Tile
        title="Outbox"
        tone={outbox.parked > 0 ? "warn" : "ok"}
        verdict={outbox.parked > 0 ? `${outbox.parked} parked` : "Flowing"}
        value={`${outbox.pending} pending`}
        detail={
          outbox.last_sent_at
            ? `Last delivered ${timeAgo(outbox.last_sent_at)}`
            : "Nothing delivered yet"
        }
      />
      <Tile
        title="Backup"
        tone={!backup ? "warn" : backupStale ? "bad" : "ok"}
        verdict={!backup ? "Never" : backupStale ? "Overdue" : "Fresh"}
        value={backup ? timeAgo(backup.at) : "—"}
        detail={
          backup
            ? `${backup.size || "?"} · ${backup.file || "unnamed"}`
            : "No backup has finished yet — is the cron job installed?"
        }
      />
      <Tile
        title="Last deploy"
        tone={lastDeploy ? "ok" : "none"}
        verdict={lastDeploy ? lastDeploy.service : "No data"}
        value={lastDeploy ? timeAgo(lastDeploy.at) : "—"}
        detail={
          lastDeploy
            ? `${lastDeploy.sha.slice(0, 7)} · ${formatDateTime(lastDeploy.at)}`
            : "No deploy has reported in yet"
        }
      />
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
      {children}
    </p>
  );
}

const th = "px-4 py-3 font-medium";
const headRow =
  "bg-muted/50 text-muted-foreground border-b text-left text-xs tracking-wide uppercase";

const severityLabel = ["Info", "Warning", "Critical"] as const;
const severityTone: Tone[] = ["none", "warn", "bad"];

export default function SystemPage() {
  const { data, isLoading, isError, error } = useSystemOverview();

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof ApiError
          ? error.message
          : "Failed to load system status"}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System</h1>
        <p className="text-muted-foreground text-sm">
          What the ops bot knows, on one page · as of{" "}
          {formatDateTime(data.generated_at)} · refreshes every minute
        </p>
      </div>

      {tiles(data)}

      <Section
        title="Uptime"
        hint="Checked by the bot every two minutes, from outside (through Caddy and TLS) and inside the Docker network."
      >
        {data.health.length === 0 ? (
          <Empty>No health checks recorded in the last 7 days.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-140 text-sm">
              <thead>
                <tr className={headRow}>
                  <th className={th}>Target</th>
                  <th className={th}>Now</th>
                  <th className={`${th} text-right`}>7-day uptime</th>
                  <th className={`${th} text-right`}>Latency</th>
                  <th className={th}>Last failure</th>
                </tr>
              </thead>
              <tbody>
                {data.health.map((h) => (
                  <tr key={h.target} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{h.target}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={h.ok ? "ok" : "bad"}>
                        {h.ok ? "Up" : "Down"}
                      </StatusBadge>
                      {!h.ok && h.detail && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {h.detail}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {h.uptime_7d.toFixed(2)}%
                      <span className="text-muted-foreground ml-1 text-xs">
                        / {h.checks_7d}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {h.ok ? `${h.latency_ms} ms` : "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                      {h.last_failure
                        ? formatDateTime(h.last_failure)
                        : "None in 7 days"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Errors"
        hint="Grouped: the same failure with a different id or number is one row. Last 7 days, newest first."
      >
        {data.errors.length === 0 ? (
          <Empty>No errors in the last 7 days.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className={headRow}>
                  <th className={th}>Last seen</th>
                  <th className={th}>Where</th>
                  <th className={th}>Error</th>
                  <th className={`${th} text-right`}>Count</th>
                  <th className={th}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {data.errors.map((e) => {
                  const sev = Math.min(Math.max(e.severity, 0), 2);
                  return (
                    <tr
                      key={e.fingerprint}
                      className="border-b align-top last:border-b-0"
                    >
                      <td
                        className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums"
                        title={formatDateTime(e.last_seen)}
                      >
                        {timeAgo(e.last_seen)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{e.service}</Badge>
                        <div className="text-muted-foreground mt-1 font-mono text-xs break-all">
                          {e.route || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="break-words">{e.message}</div>
                        <div className="text-muted-foreground mt-1 font-mono text-xs">
                          /xato {e.fingerprint}
                          {e.muted_until &&
                            new Date(e.muted_until) > new Date() &&
                            " · muted"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {e.count}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={severityTone[sev]!}>
                          {severityLabel[sev]!}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Deploys"
        hint="Reported by each CI run after its health check passes."
      >
        {data.deploys.length === 0 ? (
          <Empty>No deploys recorded yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-100 text-sm">
              <thead>
                <tr className={headRow}>
                  <th className={th}>When</th>
                  <th className={th}>Service</th>
                  <th className={th}>Commit</th>
                </tr>
              </thead>
              <tbody>
                {data.deploys.map((d) => (
                  <tr
                    key={`${d.service}-${d.sha}-${d.at}`}
                    className="border-b last:border-b-0"
                  >
                    <td className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatDateTime(d.at)}
                    </td>
                    <td className="px-4 py-3 font-medium">{d.service}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {d.sha.slice(0, 7)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
