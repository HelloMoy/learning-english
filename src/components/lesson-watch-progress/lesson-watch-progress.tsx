"use client";

import { WatchProgressBar } from "@/components/watch-progress-bar/watch-progress-bar";
import type { LessonId } from "@/domain/entities/ids/ids";
import { useLessonWatchState } from "@/hooks/use-lesson-watch-state/use-lesson-watch-state";

import { useFormatter, useTranslations } from "next-intl";

/** The bar is a percentage, so its axis runs to 100 rather than to a count. */
const PERCENT_MAX = 100;

/**
 * How much of one video the learner has watched.
 *
 * @remarks
 * A client island by necessity: the playback position lives in
 * `localStorage`, which the server cannot read. Dropping this into a Server
 * Component's row keeps that row server-rendered — only the bar itself
 * crosses to the client.
 *
 * It renders **nothing** for a lesson with no progress, and that is
 * deliberate. Bars can only appear after hydration, so the first frame
 * necessarily shows none; a bar drawn at zero in that frame would assert the
 * learner has watched nothing, which may be false. Absence is the neutral
 * state, so hydration only ever adds a bar.
 *
 * A reading lesson has no runtime and therefore no bar — its completion is
 * carried by the mark alone.
 *
 * The percentage is formatted through `next-intl`, so a locale that writes
 * `40 %` gets it.
 *
 * @param lessonId - The lesson whose progress is being shown
 * @param durationSeconds - The lesson's runtime; `0` renders nothing
 * @param className - Extra classes for the bar, so a caller can align it with
 *                    its own row padding. Passed rather than wrapped: a
 *                    wrapper would leave its spacing behind on the rows that
 *                    render nothing.
 */
export function LessonWatchProgress({
  lessonId,
  durationSeconds,
  className,
}: {
  lessonId: LessonId;
  durationSeconds: number;
  className?: string;
}) {
  const t = useTranslations("Components.LessonWatchProgress");
  const format = useFormatter();
  const { watchedFraction } = useLessonWatchState({ lessonId, durationSeconds });

  if (watchedFraction === 0) return null;

  const percent = format.number(watchedFraction, { style: "percent" });

  return (
    <WatchProgressBar
      value={Math.round(watchedFraction * PERCENT_MAX)}
      max={PERCENT_MAX}
      label={percent}
      ariaLabel={t("ariaLabel", { percent })}
      className={className}
    />
  );
}
