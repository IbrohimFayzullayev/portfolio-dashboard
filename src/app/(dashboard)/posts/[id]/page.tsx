"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { usePost, useUpdatePost } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { PostForm } from "@/components/post-form";
import { Button } from "@/components/ui/button";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data, isLoading, isError, error } = usePost(id);
  const update = useUpdatePost();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/posts">
            <ArrowLeft className="size-4" />
            Posts
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit post</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Post not found"}
        </div>
      ) : (
        <PostForm
          initial={data}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            try {
              await update.mutateAsync({ id, input });
              toast.success("Post saved");
              router.push("/posts");
            } catch (err) {
              toast.error(
                err instanceof ApiError ? err.message : "Failed to save post",
              );
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
