"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2 } from "lucide-react";

import type { Post, PostInput } from "@/lib/types";
import { slugify, todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field, ToggleField, parseList } from "@/components/content-form";

const schema = z.object({
  locale: z.enum(["en", "uz"]),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens"),
  title: z.string().min(1, "Title is required"),
  description: z.string().max(320, "Keep it under 320 characters"),
  body: z.string(),
  tags: z.string(),
  cover: z.string(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .or(z.literal("")),
  translation_key: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens")
    .or(z.literal("")),
  featured: z.boolean(),
  draft: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function PostForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Post;
  onSubmit: (input: PostInput) => Promise<void>;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      locale: initial?.locale ?? "en",
      slug: initial?.slug ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      body: initial?.body ?? "",
      tags: initial?.tags.join(", ") ?? "",
      cover: initial?.cover ?? "",
      date: initial?.date ?? todayISO(),
      translation_key: initial?.translation_key ?? "",
      featured: initial?.featured ?? false,
      draft: initial?.draft ?? true,
    },
  });

  async function submit(values: FormValues) {
    const input: PostInput = {
      locale: values.locale,
      slug: values.slug,
      title: values.title,
      description: values.description,
      body: values.body,
      tags: parseList(values.tags),
      cover: values.cover,
      date: values.date || todayISO(),
      translation_key: values.translation_key,
      featured: values.featured,
      draft: values.draft,
    };
    await onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={errors.title?.message} className="sm:col-span-2">
          <Input id="title" {...register("title")} placeholder="Post title" />
        </Field>

        <Field label="Slug" htmlFor="slug" error={errors.slug?.message}>
          <div className="flex gap-2">
            <Input id="slug" {...register("slug")} placeholder="my-post" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Generate slug from title"
              onClick={() => setValue("slug", slugify(getValues("title")), {
                shouldValidate: true,
              })}
            >
              <Wand2 className="size-4" />
            </Button>
          </div>
        </Field>

        <Field label="Locale" htmlFor="locale" error={errors.locale?.message}>
          <Select id="locale" {...register("locale")}>
            <option value="en">English</option>
            <option value="uz">O‘zbekcha</option>
          </Select>
        </Field>

        <Field
          label="Translation key"
          htmlFor="translation_key"
          error={errors.translation_key?.message}
          hint="Same key on the English and Uzbek version — that is what pairs them for hreflang. Leave empty if this exists in one language only."
        >
          <Input
            id="translation_key"
            {...register("translation_key")}
            placeholder="vps-deploy-story"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          hint="Used for SEO and post cards."
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            rows={2}
            {...register("description")}
            placeholder="One-sentence summary"
          />
        </Field>

        <Field label="Date" htmlFor="date" error={errors.date?.message}>
          <Input id="date" type="date" {...register("date")} />
        </Field>

        <Field label="Tags" htmlFor="tags" hint="Comma-separated">
          <Input id="tags" {...register("tags")} placeholder="nextjs, css" />
        </Field>

        <Field label="Cover image URL" htmlFor="cover" className="sm:col-span-2">
          <Input id="cover" {...register("cover")} placeholder="https://…" />
        </Field>

        <Field
          label="Body (Markdown / MDX)"
          htmlFor="body"
          error={errors.body?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="body"
            rows={14}
            className="font-mono text-xs"
            {...register("body")}
            placeholder="## Heading&#10;&#10;Write your post in Markdown…"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="draft"
          render={({ field }) => (
            <ToggleField
              label="Draft"
              description="Hidden from the public site."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <ToggleField
              label="Featured"
              description="Surfaced on the home page."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
