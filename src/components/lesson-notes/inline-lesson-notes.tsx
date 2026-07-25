import { Markdown } from "@/components/lesson-notes/markdown";

import { useTranslations } from "next-intl";

/**
 * Server-rendered inline notes for a Lesson. Wraps `<Markdown>` with a
 * localized heading and an accessible region. The Markdown body is
 * produced by `findLessonNotes` from a verified BlobStore key — the
 * component never accepts raw user Markdown. Raw HTML passthrough is
 * intentionally not enabled, so even a hostile note cannot inject
 * script tags via Markdown.
 */
export function InlineLessonNotes({ markdown }: { markdown: string }) {
  const t = useTranslations("Components.InlineLessonNotes");
  return (
    <section
      aria-labelledby="lesson-notes-heading"
      className="space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground"
      data-testid="inline-lesson-notes"
    >
      <h2
        id="lesson-notes-heading"
        className="text-lg font-semibold tracking-tight"
      >
        {t("heading")}
      </h2>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <Markdown content={markdown} />
      </div>
    </section>
  );
}
