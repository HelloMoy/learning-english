"use client";

import { Markdown } from "@/components/lesson-notes/markdown";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { splitBilingualNotes } from "../split-bilingual-notes/split-bilingual-notes";

const COLUMN_LABEL = "text-xs font-bold tracking-[0.32em] text-gold uppercase";
const PROSE = "prose prose-sm prose-slate dark:prose-invert max-w-none text-foreground";

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
 * Notes tab splits the bilingual `readme.md` into "Español" / "English"
 * columns (falling back to a single column when the split is ambiguous).
 * The Transcript tab is present for visual parity but disabled — no
 * transcript data exists — so activating it only reveals a localized
 * "not available" notice, never transcript content.
 */
export function LessonNotesTabs({
  markdown,
  description,
}: {
  markdown: string;
  description?: string;
}) {
  const t = useTranslations("Components.LessonTabs");
  const [tab, setTab] = useState<"notes" | "transcript">("notes");
  const notes = splitBilingualNotes(markdown);

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
          {notes.kind === "split" ? (
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h3 className={COLUMN_LABEL}>{t("spanish")}</h3>
                <div className={PROSE}>
                  <Markdown content={notes.es} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className={COLUMN_LABEL}>{t("english")}</h3>
                <div className={PROSE}>
                  <Markdown content={notes.en} />
                </div>
              </div>
            </div>
          ) : (
            <div className={PROSE}>
              <Markdown content={notes.markdown} />
            </div>
          )}
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
