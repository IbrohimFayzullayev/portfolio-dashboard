"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useProject, useUpdateProject } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { ProjectForm } from "@/components/project-form";
import { Button } from "@/components/ui/button";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data, isLoading, isError, error } = useProject(id);
  const update = useUpdateProject();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit project</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Project not found"}
        </div>
      ) : (
        <ProjectForm
          initial={data}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            try {
              await update.mutateAsync({ id, input });
              toast.success("Project saved");
              router.push("/projects");
            } catch (err) {
              toast.error(
                err instanceof ApiError ? err.message : "Failed to save project",
              );
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
