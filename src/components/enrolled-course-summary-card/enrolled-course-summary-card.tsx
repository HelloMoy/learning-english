import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { CourseCardModel, TargetVideo } from "@/lib/course-shelf/course-shelf";
import { cn } from "@/lib/utils/utils";
import { watchedFraction } from "@/lib/watch-progress/watch-progress";

import { useTranslations } from "next-intl";
import Image from "next/image";

/** Props for {@link EnrolledCourseSummaryCard}. */
export type EnrolledCourseSummaryCardProps = {
  model: CourseCardModel;
  /** The course My learning leads with; its card wears the gold border. */
  isCurrent: boolean;
};

/**
 * One enrolled course on My learning's Your courses: its share watched, and the
 * video it continues with.
 *
 * @remarks
 * Each course keeps its own place (capability `course-enrollment`), so every
 * card names its own next video. A finished course's card offers **Watch
 * again** instead of **Continue**. The card of the course the page leads with
 * is marked current.
 *
 * @example
 * ```tsx
 * <EnrolledCourseSummaryCard model={courseCardModel(shelfCourse, learner)} isCurrent />
 * ```
 */
export function EnrolledCourseSummaryCard({ model, isCurrent }: EnrolledCourseSummaryCardProps) {
  const t = useTranslations("Components.EnrolledCourseSummaryCard");
  const { course, tally, target, isCompleted } = model;

  return (
    <article
      data-testid="enrolled-course-summary-card"
      data-current={isCurrent}
      className={cn(
        "flex flex-col gap-4 rounded-[22px] border bg-card p-4.5",
        isCurrent ? "border-gold/60" : "border-border",
      )}
    >
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3.5">
        <ProgressRing
          size={56}
          fraction={tally.completedFraction}
        >
          <span className="text-xs font-black">
            {t("percent", { percent: tally.completedFraction })}
          </span>
        </ProgressRing>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-lg leading-tight font-black tracking-[-0.02em] text-foreground">
            {course.title}
          </h3>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {t("progress", { completed: tally.completedCount, total: tally.lessonCount })}
          </span>
        </div>
      </div>
      {target ? (
        <NextUpRow
          model={model}
          target={target}
        />
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        {target ? (
          <Link
            href={lessonPath(course, target.module, target.lesson) as never}
            className="inline-flex min-h-11 items-center rounded-[11px] border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t(isCompleted ? "watchAgain" : "continue")}
          </Link>
        ) : null}
        <Link
          href={courseOverviewPath(course) as never}
          className="inline-flex min-h-11 items-center rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("viewCourse")}
        </Link>
      </div>
    </article>
  );
}

function NextUpRow({ model, target }: { model: CourseCardModel; target: TargetVideo }) {
  const t = useTranslations("Components.EnrolledCourseSummaryCard");
  const runtimeLabel = useRuntimeLabel();
  const watched = watchedFraction(model.targetPositionSeconds, target.lesson.durationSeconds);

  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3.5 rounded-[14px] bg-secondary/60 p-2.5">
      <span
        aria-hidden="true"
        className="relative aspect-video overflow-hidden rounded-lg bg-secondary"
      >
        {target.lesson.poster ? (
          <Image
            src={target.lesson.poster}
            alt=""
            fill
            sizes="104px"
            className="object-cover"
          />
        ) : null}
        {watched > 0 ? (
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
            <span
              className="block h-full bg-gold"
              style={{ width: `${watched * 100}%` }}
            />
          </span>
        ) : null}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[0.625rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t(model.isCompleted ? "startOver" : "nextUp")}
        </span>
        <span className="truncate text-[0.9375rem] font-extrabold text-foreground">
          {target.lesson.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("position", {
            module: target.module.sequence,
            moduleTitle: target.module.title,
            number: target.lessonNumber,
            total: model.targetVideoCount,
            duration: runtimeLabel(target.lesson.durationSeconds),
          })}
        </span>
      </div>
    </div>
  );
}
