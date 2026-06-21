"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useCreateProject } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { ProjectForm } from "@/components/project-form";
import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  const router = useRouter();
  const create = useCreateProject();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New project</h1>
      </div>

      <ProjectForm
        submitLabel="Create project"
        onSubmit={async (input) => {
          try {
            await create.mutateAsync(input);
            toast.success("Project created");
            router.push("/projects");
          } catch (err) {
            toast.error(
              err instanceof ApiError ? err.message : "Failed to create project",
            );
            throw err;
          }
        }}
      />
    </div>
  );
}
