import { courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { CourseCardModel } from "@/lib/course-shelf/course-shelf";
import { watchedFraction } from "@/lib/watch-progress/watch-progress";

import { Check, Play, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** Props for {@link EnrolledCourseCard}. */
export type EnrolledCourseCardProps = {
  model: CourseCardModel;
};

/**
 * One of the learner's other enrolled courses on Available courses: its next
 * video's thumbnail, how far along the course is, and the way back in.
 *
 * @remarks
 * The marks follow the lesson tiles' language: an enrolled course in progress
 * wears the outlined gold chip, a finished one the solid gold chip.
 *
 * A course whose every video counts as complete reads **Completed**, shows its
 * prizes claimed out of total and offers **Watch again**, which opens its
 * first video; any other course shows the next video with its module and
 * offers **Continue**. **View course** opens the course overview either way.
 *
 * @example
 * ```tsx
 * <EnrolledCourseCard model={courseCardModel(shelfCourse, learner)} />
 * ```
 */
export function EnrolledCourseCard({ model }: EnrolledCourseCardProps) {
  const t = useTranslations("Components.EnrolledCourseCard");
  const { course, tally, target, isCompleted } = model;

  return (
    <article
      data-testid="enrolled-course-card"
      className="grid grid-cols-1 items-center gap-4 rounded-[22px] border border-border bg-card p-3 sm:grid-cols-[11.25rem_minmax(0,1fr)]"
    >
      <CardThumbnail model={model} />
      <div className="flex min-w-0 flex-col gap-2 px-1 pb-1 sm:px-0 sm:pb-0">
        <div className="flex flex-wrap items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-primary-foreground">
              <Check
                aria-hidden="true"
                className="size-3"
              />
              {t("completed")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold ring-1 ring-gold/50">
              <Check
                aria-hidden="true"
                className="size-3"
              />
              {t("enrolled")}
            </span>
          )}
          <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
            {t("level", { level: course.sequence })}
          </span>
        </div>
        <h3 className="text-lg leading-tight font-black tracking-[-0.02em] text-foreground">
          {course.title}
        </h3>
        <div className="flex items-center gap-2.5">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${tally.completedFraction * 100}%` }}
            />
          </span>
          <span className="font-mono text-[0.6875rem] whitespace-nowrap text-muted-foreground tabular-nums">
            {t("progress", {
              completed: tally.completedCount,
              total: tally.lessonCount,
              percent: tally.completedFraction,
            })}
          </span>
        </div>
        <CardStatusLine model={model} />
        <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {target ? (
            <Link
              href={lessonPath(course, target.module, target.lesson) as never}
              className="inline-flex min-h-10 items-center gap-2 rounded-[11px] border border-border bg-card px-3.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {isCompleted ? (
                <RotateCcw
                  aria-hidden="true"
                  className="size-3.5"
                />
              ) : (
                <Play
                  aria-hidden="true"
                  className="size-3.5"
                  fill="currentColor"
                />
              )}
              {t(isCompleted ? "watchAgain" : "continue")}
            </Link>
          ) : null}
          <Link
            href={courseOverviewPath(course) as never}
            className="inline-flex min-h-10 items-center rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("viewCourse")}
          </Link>
        </div>
      </div>
    </article>
  );
}

function CardThumbnail({ model }: { model: CourseCardModel }) {
  const { target, targetPositionSeconds } = model;
  const poster = target?.lesson.poster;
  const watched = target
    ? watchedFraction(targetPositionSeconds, target.lesson.durationSeconds)
    : 0;

  return (
    <span
      aria-hidden="true"
      className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-secondary"
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 640px) 180px, 100vw"
          className="object-cover"
        />
      ) : null}
      {watched > 0 ? (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
          <span
            className="block h-full bg-gold"
            style={{ width: `${watched * 100}%` }}
          />
        </span>
      ) : null}
    </span>
  );
}

function CardStatusLine({ model }: { model: CourseCardModel }) {
  const t = useTranslations("Components.EnrolledCourseCard");
  const { target, prizes, isCompleted } = model;

  if (isCompleted) {
    const claimed = prizes.filter((entry) => entry.isClaimed).length;
    return (
      <span className="text-[0.8125rem] text-muted-foreground">
        {t("prizes", { claimed, total: prizes.length })}
      </span>
    );
  }
  if (!target) return null;
  return (
    <span className="text-[0.8125rem] text-muted-foreground">
      {t.rich("nextUp", {
        title: target.lesson.title,
        module: String(target.module.sequence).padStart(2, "0"),
        strong: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>,
      })}
    </span>
  );
}
