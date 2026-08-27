"use client";

import * as React from "react";
import { ChevronDown, Copy, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useInvitations, useDeleteInvitation } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** "27.08.2026, 19:04" — submissions are time-sensitive, so show the clock. */
function formatReceived(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InvitationsPage() {
  const { data, isLoading, isError, error } = useInvitations();
  const del = useDeleteInvitation();
  const [open, setOpen] = React.useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this submission? This cannot be undone.")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Submission deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function onCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Invitation copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof ApiError ? error.message : "Failed to load submissions"}
      </p>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total
            ? `${data.total} submission${data.total === 1 ? "" : "s"} · refreshes automatically`
            : "Nothing yet"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Mail className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No submissions yet</p>
            <p className="text-sm text-muted-foreground">
              They appear here the moment someone finishes the invitation site.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Menu</th>
                <th className="px-4 py-3 font-medium">Place</th>
                <th className="px-4 py-3 font-medium">Visitor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => {
                const expanded = open === inv.id;
                return (
                  <React.Fragment key={inv.id}>
                    <tr className="border-b last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                        {formatReceived(inv.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                        {inv.date} · {inv.time}
                      </td>
                      <td className="px-4 py-3">
                        {inv.food_emoji} {inv.food_label || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {inv.place_emoji} {inv.place_label || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {inv.session_id ? (
                          <Badge variant="secondary" className="font-mono text-[11px]">
                            {inv.session_id.slice(0, 8)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={expanded ? "Hide letter" : "Show letter"}
                            onClick={() => setOpen(expanded ? null : inv.id)}
                          >
                            <ChevronDown
                              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy invitation"
                            onClick={() => onCopy(inv.invite_text)}
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            onClick={() => onDelete(inv.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="border-b bg-muted/30 last:border-b-0">
                        <td colSpan={6} className="px-4 py-4">
                          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
                            {inv.invite_text || "(no letter stored)"}
                          </pre>
                          {inv.user_agent && (
                            <p className="mt-3 truncate text-xs text-muted-foreground">
                              {inv.user_agent}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
