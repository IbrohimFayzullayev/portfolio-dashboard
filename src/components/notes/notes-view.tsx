"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNote, useNotes } from "@/lib/growth/hooks";
import { Failure, Loading } from "@/components/growth/growth-overview";

/**
 * Personal reference documents: the sprint plan, the resources, the bot
 * guide. A list, and a reader. The selected document can be controlled from
 * outside (the Mini App's ?doc= deep link) or left to this component.
 */
export function NotesView({
  initialSlug = "",
  onOpen,
}: {
  initialSlug?: string;
  /** Told about every open/close, so a page can mirror it in its URL. */
  onOpen?: (slug: string) => void;
}) {
  const [slug, setSlug] = React.useState(initialSlug);
  const open = (next: string) => {
    setSlug(next);
    onOpen?.(next);
    window.scrollTo({ top: 0 });
  };

  return slug ? (
    <NoteReader slug={slug} onBack={() => open("")} />
  ) : (
    <NoteList onOpen={open} />
  );
}

function NoteList({ onOpen }: { onOpen: (slug: string) => void }) {
  const notes = useNotes();
  if (notes.isLoading) return <Loading />;
  if (notes.error || !notes.data) return <Failure error={notes.error} />;
  return (
    <ul className="space-y-2">
      {notes.data.map((n) => (
        <li key={n.slug}>
          <button
            type="button"
            onClick={() => onOpen(n.slug)}
            className="bg-card hover:bg-accent flex w-full items-center gap-3 rounded-xl border p-4 text-left shadow-sm transition-colors"
          >
            <FileText className="text-muted-foreground size-5 shrink-0" />
            <span className="font-medium">{n.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NoteReader({ slug, onBack }: { slug: string; onBack: () => void }) {
  const note = useNote(slug);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Hujjatlar
      </button>
      {note.isLoading ? (
        <Loading />
      ) : note.error || !note.data ? (
        <Failure error={note.error} />
      ) : (
        <article className="bg-card rounded-xl border p-4 shadow-sm sm:p-6">
          <Markdown body={note.data.body} />
        </article>
      )}
    </div>
  );
}

/* Typography by hand: the dashboard has no prose plugin, and a handful of
 * element styles is all a plan and a list of books need. Tables scroll
 * sideways on a phone instead of squeezing their columns to nothing. */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-xl font-bold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-7 mb-3 border-b pb-1 text-lg font-semibold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="mt-5 mb-2 font-semibold">{children}</h3>,
  p: ({ children }) => <p className="my-2.5 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2.5 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="text-muted-foreground my-3 border-l-2 pl-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6" />,
  code: ({ children, className }) => (
    <code
      className={cn(
        "bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]",
        className,
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted my-3 overflow-x-auto rounded-lg p-3 text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="-mx-1 my-3 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-muted border px-2 py-1.5 text-left align-top font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border px-2 py-1.5 align-top">{children}</td>
  ),
};

export function Markdown({ body }: { body: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
