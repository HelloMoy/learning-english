"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { useLessonWatchState } from "@/hooks/use-lesson-watch-state/use-lesson-watch-state";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The "you have taken this lesson" indicator.
 *
 * @remarks
 * A client island by necessity: completion lives in `localStorage`, which
 * the server cannot read. Dropping this into a Server Component's row keeps
 * that row server-rendered — only the mark itself crosses to the client.
 *
 * It renders **nothing** for an uncompleted lesson, and that is deliberate,
 * not an omission. Marks can only appear after hydration, so the first
 * frame necessarily shows none; if the component also drew a "not
 * completed" state, that frame would assert something false about the
 * learner's progress. Absence is the neutral state, so hydration only ever
 * adds a mark.
 *
 * The check icon is decorative and the meaning is carried by a localized
 * accessible name, so the distinction never rests on colour or glyph alone.
 *
 * Completion has two producers — the **Mark as complete** button and playback
 * reaching the end of the video — and this reads both through
 * `useLessonWatchState`. A caller that passes the lesson's runtime therefore
 * marks a lesson the learner watched to the end but never pressed the button
 * on; a caller that cannot supply one falls back to the stored mark alone.
 *
 * @param lessonId - The lesson whose completion is being shown
 * @param durationSeconds - The lesson's runtime, where the caller knows it;
 *                          omit for a lesson that has none
 */
export function LessonCompletionMark({
  lessonId,
  durationSeconds = 0,
}: {
  lessonId: LessonId;
  durationSeconds?: number;
}) {
  const t = useTranslations("Components.LessonCompletion");
  const { isComplete } = useLessonWatchState({ lessonId, durationSeconds });

  if (!isComplete) return null;

  return (
    <span
      data-testid="lesson-completion-mark"
      title={t("completed")}
      className="inline-flex shrink-0 items-center gap-1 text-gold"
    >
      <Check
        aria-hidden="true"
        className="size-4"
      />
      <span className="sr-only">{t("completed")}</span>
    </span>
  );
}
