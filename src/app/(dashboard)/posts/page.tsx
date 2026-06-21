"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  usePosts,
  useDeletePost,
  usePublishPost,
} from "@/lib/hooks";
import type { ContentStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export default function PostsPage() {
  const [locale, setLocale] = React.useState("all");
  const [status, setStatus] = React.useState<ContentStatus>("all");

  const { data, isLoading, isError, error } = usePosts({ locale, status });
  const del = useDeletePost();
  const publish = usePublishPost();

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function onTogglePublish(id: string, draft: boolean) {
    try {
      await publish.mutateAsync({ id, draft: !draft });
      toast.success(!draft ? "Moved to drafts" : "Published");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.length} total` : "Loading…"}
          </p>
        </div>
        <Button asChild>
          <Link href="/posts/new">
            <Plus className="size-4" />
            New post
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="h-9 w-36"
        >
          <option value="all">All locales</option>
          <option value="en">English</option>
          <option value="uz">O‘zbekcha</option>
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus)}
          className="h-9 w-36"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={error instanceof ApiError ? error.message : "Failed to load"} />
      ) : data && data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Locale</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((post) => (
                <tr key={post.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/posts/${post.id}`}
                      className="font-medium hover:underline"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {post.locale}
                  </td>
                  <td className="px-4 py-3">
                    {post.draft ? (
                      <Badge variant="warning">Draft</Badge>
                    ) : (
                      <Badge variant="success">Published</Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {formatDate(post.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={post.draft ? "Publish" : "Unpublish"}
                        onClick={() => onTogglePublish(post.id, post.draft)}
                      >
                        {post.draft ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" asChild aria-label="Edit">
                        <Link href={`/posts/${post.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => onDelete(post.id, post.title)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          message="No posts yet."
          href="/posts/new"
          cta="Create your first post"
        />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-xl border py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
      {message}
    </div>
  );
}

function EmptyState({
  message,
  href,
  cta,
}: {
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild>
        <Link href={href}>
          <Plus className="size-4" />
          {cta}
        </Link>
      </Button>
    </div>
  );
}
