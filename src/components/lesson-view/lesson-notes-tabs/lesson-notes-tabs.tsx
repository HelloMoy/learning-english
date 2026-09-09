"use client";

import { Markdown } from "@/components/lesson-notes/markdown/markdown";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { selectNotesForLocale } from "../select-notes-for-locale/select-notes-for-locale";

function tabClass(active: boolean, disabled = false): string {
  if (disabled) {
    return "cursor-not-allowed rounded-lg border border-border bg-foreground/5 px-4 py-2 text-sm font-semibold text-muted-foreground/60";
  }
  return active
    ? "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
    : "rounded-lg border border-border bg-foreground/5 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground";
}

/**
 * The Lesson Page's Notes/Transcript tab pair (design.md §D6/§D7). The
 * Notes tab renders the `readme.md` section written in the app's active
 * locale — one language at a time, never a side-by-side pair — falling back
 * to English and then Spanish when the notes do not carry that locale. The
 * Transcript tab is present for visual parity but disabled — no transcript
 * data exists — so activating it only reveals a localized "not available"
 * notice, never transcript content.
 */
export function LessonNotesTabs({
  markdown,
  description,
}: {
  markdown: string;
  description?: string;
}) {
  const t = useTranslations("Components.LessonTabs");
  const locale = useLocale();
  const [tab, setTab] = useState<"notes" | "transcript">("notes");
  const notes = selectNotesForLocale(markdown, locale);

  return (
    <section
      data-testid="lesson-notes-tabs"
      className="flex flex-col gap-5"
    >
      {description ? <p className="text-muted-foreground">{description}</p> : null}

      <div
        role="tablist"
        aria-label={t("notes")}
        className="flex gap-2"
      >
        <button
          type="button"
          role="tab"
          id="lesson-tab-notes"
          aria-selected={tab === "notes"}
          aria-controls="lesson-panel-notes"
          onClick={() => setTab("notes")}
          className={tabClass(tab === "notes")}
        >
          {t("notes")}
        </button>
        <button
          type="button"
          role="tab"
          id="lesson-tab-transcript"
          aria-selected={tab === "transcript"}
          aria-controls="lesson-panel-transcript"
          aria-disabled="true"
          onClick={() => setTab("transcript")}
          className={tabClass(tab === "transcript", true)}
        >
          {t("transcript")}
        </button>
      </div>

      {tab === "notes" ? (
        <div
          role="tabpanel"
          id="lesson-panel-notes"
          aria-labelledby="lesson-tab-notes"
        >
          <Markdown content={notes} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="lesson-panel-transcript"
          aria-labelledby="lesson-tab-transcript"
        >
          <p className="text-muted-foreground">{t("transcriptUnavailable")}</p>
        </div>
      )}
    </section>
  );
}
