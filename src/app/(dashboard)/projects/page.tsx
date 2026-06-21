"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useProjects, useDeleteProject } from "@/lib/hooks";
import type { ContentStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export default function ProjectsPage() {
  const [locale, setLocale] = React.useState("all");
  const [status, setStatus] = React.useState<ContentStatus>("all");

  const { data, isLoading, isError, error } = useProjects({ locale, status });
  const del = useDeleteProject();

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.length} total` : "Loading…"}
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="size-4" />
            New project
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
        <div className="flex items-center justify-center rounded-xl border py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Failed to load"}
        </div>
      ) : data && data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Locale</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Order</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((project) => (
                <tr key={project.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{project.slug}</p>
                  </td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {project.locale}
                  </td>
                  <td className="px-4 py-3">
                    {project.draft ? (
                      <Badge variant="warning">Draft</Badge>
                    ) : (
                      <Badge variant="success">Published</Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {project.order}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {formatDate(project.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label="Edit">
                        <Link href={`/projects/${project.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => onDelete(project.id, project.title)}
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
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" />
              Create your first project
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
