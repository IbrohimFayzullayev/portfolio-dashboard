"use client";

import * as React from "react";
import { Check, Inbox, Loader2, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useContactMessages,
  useDeleteContactMessage,
  useMarkContactMessageRead,
} from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { ContactMessage } from "@/lib/types";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** A reply that opens in the mail client with the original quoted below. */
function replyHref(m: ContactMessage): string {
  const quoted = m.message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const params = new URLSearchParams({
    subject: "Re: your message on fayzullayev.uz",
    body: `\n\n${quoted}`,
  });
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${m.email}?${params.toString().replace(/\+/g, "%20")}`;
}

export default function MessagesPage() {
  const { data, isLoading, isError, error } = useContactMessages();
  const markRead = useMarkContactMessageRead();
  const del = useDeleteContactMessage();

  async function onMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof ApiError ? error.message : "Failed to load messages"}
      </p>
    );
  }

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm">
          {data?.total
            ? `${data.total} message${data.total === 1 ? "" : "s"} from the contact form · ${unread} unread`
            : "From the contact form on the public site"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Inbox className="text-muted-foreground size-8" />
          <div>
            <p className="font-medium">No messages yet</p>
            <p className="text-muted-foreground text-sm">
              When someone writes through the site, it lands here and in
              Telegram.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => {
            const isUnread = m.read_at === null;
            return (
              <li
                key={m.id}
                className={cn(
                  "bg-card rounded-lg border p-5",
                  isUnread && "border-foreground/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {isUnread && <Badge>New</Badge>}
                      {m.locale && (
                        <Badge variant="muted" className="uppercase">
                          {m.locale}
                        </Badge>
                      )}
                    </div>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-muted-foreground hover:text-foreground text-sm break-all transition-colors"
                    >
                      {m.email}
                    </a>
                  </div>
                  <time
                    dateTime={m.created_at}
                    title={formatDateTime(m.created_at)}
                    className="text-muted-foreground text-xs whitespace-nowrap tabular-nums"
                  >
                    {timeAgo(m.created_at)} · {formatDateTime(m.created_at)}
                  </time>
                </div>

                <p className="mt-4 text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {m.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button asChild size="sm">
                    <a
                      href={replyHref(m)}
                      onClick={() => {
                        if (isUnread) void onMarkRead(m.id);
                      }}
                    >
                      <Reply className="size-4" />
                      Reply
                    </a>
                  </Button>
                  {isUnread && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkRead(m.id)}
                    >
                      <Check className="size-4" />
                      Mark as read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    aria-label="Delete message"
                    onClick={() => onDelete(m.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
