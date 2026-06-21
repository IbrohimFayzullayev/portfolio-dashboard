"use client";

import Link from "next/link";
import { FileText, FolderKanban, Plus } from "lucide-react";

import { usePosts, useProjects } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewPage() {
  const { user } = useAuth();
  const posts = usePosts({ status: "all" });
  const projects = useProjects({ status: "all" });

  const postCount = posts.data?.length ?? 0;
  const postDrafts = posts.data?.filter((p) => p.draft).length ?? 0;
  const projectCount = projects.data?.length ?? 0;
  const projectDrafts = projects.data?.filter((p) => p.draft).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your blog posts and projects from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<FileText className="size-5" />}
          label="Posts"
          total={postCount}
          drafts={postDrafts}
          href="/posts"
          loading={posts.isLoading}
        />
        <StatCard
          icon={<FolderKanban className="size-5" />}
          label="Projects"
          total={projectCount}
          drafts={projectDrafts}
          href="/projects"
          loading={projects.isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/posts/new">
            <Plus className="size-4" />
            New post
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/projects/new">
            <Plus className="size-4" />
            New project
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  total,
  drafts,
  href,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  total: number;
  drafts: number;
  href: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tracking-tight">
          {loading ? "—" : total}
        </div>
        <p className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${total - drafts} published · ${drafts} drafts`}
        </p>
        <Button asChild variant="link" className="h-auto p-0 text-sm">
          <Link href={href}>Manage {label.toLowerCase()} →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
