"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useCreatePost } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { PostForm } from "@/components/post-form";
import { Button } from "@/components/ui/button";

export default function NewPostPage() {
  const router = useRouter();
  const create = useCreatePost();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/posts">
            <ArrowLeft className="size-4" />
            Posts
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New post</h1>
      </div>

      <PostForm
        submitLabel="Create post"
        onSubmit={async (input) => {
          try {
            await create.mutateAsync(input);
            toast.success("Post created");
            router.push("/posts");
          } catch (err) {
            toast.error(
              err instanceof ApiError ? err.message : "Failed to create post",
            );
            throw err;
          }
        }}
      />
    </div>
  );
}
