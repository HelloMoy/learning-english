import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { Link } from "@/i18n/navigation";

import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

/** A progress reading is drawn as a whole percentage. */
const PERCENT_MAX = 100;

/**
 * The way back into the lesson the learner left: where it sits, what it is
 * called, how far in they got, and one action to resume.
 *
 * @remarks
 * `Resume` is the panel's one primary action and its only playback
 * affordance. The course overview stays one click away through a visibly
 * quieter link, so the panel never offers two equal ways in.
 *
 * The bar is drawn only when there is something honest to draw — a video with
 * a saved position. A reading lesson, or a video never played, gets no bar
 * rather than one sitting at zero.
 *
 * @param panel - The resolved continue-watching panel
 * @param moduleLessonCount - How many videos the lesson's module holds
 * @param watchedFraction - The elapsed share in `[0, 1]`, or `null` when there is nothing to measure
 * @param courseHref - Locale-relative path of the lesson's course overview
 */
export function ResumePanel({
  panel,
  moduleLessonCount,
  watchedFraction,
  courseHref,
}: {
  panel: ContinueWatchingPanel;
  moduleLessonCount: number;
  watchedFraction: number | null;
  courseHref: string;
}) {
  const t = useTranslations("Components.ResumePanel");

  return (
    <div className="flex flex-col gap-4 rounded-[1.125rem] border border-border bg-card p-5 sm:p-6">
      <p className="text-xs text-muted-foreground sm:text-sm">
        {t("position", {
          course: panel.courseTitle,
          moduleNumber: panel.moduleSequence,
          moduleTitle: panel.moduleTitle,
          lessonNumber: panel.lessonSequence,
          total: moduleLessonCount,
        })}
      </p>
      <p className="font-sans text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.75rem]">
        {panel.lessonTitle}
      </p>
      {watchedFraction === null ? null : (
        <div
          role="progressbar"
          aria-label={t("progressLabel")}
          aria-valuemin={0}
          aria-valuemax={PERCENT_MAX}
          aria-valuenow={Math.round(watchedFraction * PERCENT_MAX)}
          className="h-1 overflow-hidden rounded-full bg-secondary"
        >
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.round(watchedFraction * PERCENT_MAX)}%` }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-5">
        <Link
          href={panel.lessonHref as never}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-[0.9375rem] font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("resume")}
        </Link>
        <Link
          href={courseHref as never}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("viewCourse")}
          <ArrowRight
            aria-hidden="true"
            className="size-4"
          />
        </Link>
      </div>
    </div>
  );
}
