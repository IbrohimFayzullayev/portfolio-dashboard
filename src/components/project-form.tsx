"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wand2 } from "lucide-react";

import type { Project, ProjectInput } from "@/lib/types";
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
  stack: z.string(),
  url: z.string().url("Must be a valid URL").or(z.literal("")),
  repo: z.string().url("Must be a valid URL").or(z.literal("")),
  order: z.string().regex(/^-?\d+$/, "Whole number").or(z.literal("")),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .or(z.literal("")),
  featured: z.boolean(),
  draft: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ProjectForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Project;
  onSubmit: (input: ProjectInput) => Promise<void>;
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
      stack: initial?.stack.join(", ") ?? "",
      url: initial?.url ?? "",
      repo: initial?.repo ?? "",
      order: initial?.order != null ? String(initial.order) : "0",
      date: initial?.date ?? todayISO(),
      featured: initial?.featured ?? false,
      draft: initial?.draft ?? true,
    },
  });

  async function submit(values: FormValues) {
    const input: ProjectInput = {
      locale: values.locale,
      slug: values.slug,
      title: values.title,
      description: values.description,
      body: values.body,
      tags: parseList(values.tags),
      stack: parseList(values.stack),
      url: values.url,
      repo: values.repo,
      order: Number(values.order) || 0,
      date: values.date || todayISO(),
      featured: values.featured,
      draft: values.draft,
    };
    await onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Title"
          htmlFor="title"
          error={errors.title?.message}
          className="sm:col-span-2"
        >
          <Input id="title" {...register("title")} placeholder="Project name" />
        </Field>

        <Field label="Slug" htmlFor="slug" error={errors.slug?.message}>
          <div className="flex gap-2">
            <Input id="slug" {...register("slug")} placeholder="my-project" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Generate slug from title"
              onClick={() =>
                setValue("slug", slugify(getValues("title")), {
                  shouldValidate: true,
                })
              }
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
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            rows={2}
            {...register("description")}
            placeholder="Short description"
          />
        </Field>

        <Field label="Live URL" htmlFor="url" error={errors.url?.message}>
          <Input id="url" {...register("url")} placeholder="https://…" />
        </Field>

        <Field label="Repository URL" htmlFor="repo" error={errors.repo?.message}>
          <Input id="repo" {...register("repo")} placeholder="https://github.com/…" />
        </Field>

        <Field label="Tech stack" htmlFor="stack" hint="Comma-separated">
          <Input id="stack" {...register("stack")} placeholder="Next.js, Go" />
        </Field>

        <Field label="Tags" htmlFor="tags" hint="Comma-separated">
          <Input id="tags" {...register("tags")} placeholder="product, frontend" />
        </Field>

        <Field label="Date" htmlFor="date" error={errors.date?.message}>
          <Input id="date" type="date" {...register("date")} />
        </Field>

        <Field
          label="Order"
          htmlFor="order"
          error={errors.order?.message}
          hint="Higher shows first."
        >
          <Input id="order" type="number" {...register("order")} />
        </Field>

        <Field
          label="Body (Markdown / MDX)"
          htmlFor="body"
          error={errors.body?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="body"
            rows={12}
            className="font-mono text-xs"
            {...register("body")}
            placeholder="## Overview&#10;&#10;Describe the project…"
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
