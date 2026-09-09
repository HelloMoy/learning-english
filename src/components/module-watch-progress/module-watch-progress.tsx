"use client";

import { WatchProgressBar } from "@/components/watch-progress-bar/watch-progress-bar";
import type { LessonRuntime } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useModuleWatchProgress } from "@/hooks/use-module-watch-progress/use-module-watch-progress";

import { useTranslations } from "next-intl";

/**
 * How many of a module's videos the learner has finished.
 *
 * @remarks
 * A client island by necessity: completion and playback position live in
 * `localStorage`, which the server cannot read. Dropping this into a showcase
 * card keeps the card server-rendered — only the meter crosses to the client.
 *
 * It renders **nothing** for a module with no completed lesson, and that is
 * deliberate. Meters can only appear after hydration, so the first frame
 * necessarily shows none; a meter drawn at zero in that frame would assert
 * the learner has watched nothing, which may be false.
 *
 * A finished module states that it is finished rather than leaving two equal
 * numbers to be compared — "17 / 17" is a reading exercise, "Lesson
 * completed" is an answer. The copy says *lesson*, not *module*: the
 * `course-vocabulary` capability fixes each term to one level, and a
 * `Module` is a "Lesson" to the learner.
 *
 * It counts every lesson the module holds, not the bounded set the card's
 * gallery previews, so a lesson finished outside the preview is not lost.
 *
 * @param lessonRuntimes - The module's lessons, each with its runtime; pass
 *                         `ModuleSummary.lessonRuntimes` straight through
 */
export function ModuleWatchProgress({
  lessonRuntimes,
}: {
  lessonRuntimes: ReadonlyArray<LessonRuntime>;
}) {
  const t = useTranslations("Components.ModuleWatchProgress");
  const { completedCount, lessonCount } = useModuleWatchProgress(lessonRuntimes);

  if (completedCount === 0) return null;

  const isModuleComplete = completedCount === lessonCount;

  return (
    <WatchProgressBar
      value={completedCount}
      max={lessonCount}
      label={
        isModuleComplete
          ? t("completedLabel")
          : t("label", { completed: completedCount, total: lessonCount })
      }
      ariaLabel={
        isModuleComplete
          ? t("completedAriaLabel", { total: lessonCount })
          : t("ariaLabel", { completed: completedCount, total: lessonCount })
      }
    />
  );
}
