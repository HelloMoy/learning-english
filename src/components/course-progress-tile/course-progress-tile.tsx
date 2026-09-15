import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { Course } from "@/domain/entities/course/course";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import type { ProgressTally } from "@/lib/course-overview-progress/course-overview-progress";

import { useTranslations } from "next-intl";

/** What the course tile knows about progress: nothing yet, or this device's reading. */
export type CourseProgressReading =
  { status: "pending" } | { status: "read"; tally: ProgressTally };

/** Props for {@link CourseProgressTile}. */
export type CourseProgressTileProps = {
  course: Course;
  reading: CourseProgressReading;
};

/**
 * The course overview's progress tile: the course title as the page heading, a
 * large ring filled to the watched share, and how much is left in videos and time.
 *
 * @remarks
 * On a phone the ring leads a row; from `lg` the tile is a centred column. The
 * title always renders — on the server too — while the ring stays empty and the
 * figures stay hidden until this device's progress has been read.
 *
 * @example
 * ```tsx
 * <CourseProgressTile course={course} reading={{ status: "read", tally }} />
 * ```
 */
export function CourseProgressTile({ course, reading }: CourseProgressTileProps) {
  const tally = reading.status === "read" ? reading.tally : null;

  return (
    <section
      data-testid="course-progress-tile"
      data-status={reading.status}
      className="flex items-center gap-4 rounded-[22px] border border-border bg-card p-4 lg:flex-col lg:justify-center lg:gap-4 lg:rounded-[26px] lg:p-6 lg:text-center"
    >
      <span className="lg:hidden">
        <CourseRing
          size={96}
          tally={tally}
        />
      </span>
      <span className="hidden lg:order-2 lg:block">
        <CourseRing
          size={190}
          tally={tally}
        />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5 lg:contents">
        <h1 className="font-sans text-[1.625rem] leading-none font-black tracking-[-0.03em] text-balance text-foreground lg:order-1 lg:text-3xl">
          {course.title}
        </h1>
        <span className="lg:order-3">
          <CourseFigures tally={tally} />
        </span>
      </div>
    </section>
  );
}

function CourseRing({ size, tally }: { size: number; tally: ProgressTally | null }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <ProgressRing
      size={size}
      fraction={tally?.completedFraction ?? 0}
    >
      {tally ? (
        <span className={size > 100 ? "text-4xl font-black" : "text-xl font-black"}>
          {t("percentComplete", { percent: tally.completedFraction })}
        </span>
      ) : null}
    </ProgressRing>
  );
}

function CourseFigures({ tally }: { tally: ProgressTally | null }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();

  if (!tally) return <Skeleton className="h-3.5 w-44" />;

  const remaining =
    tally.completedCount === tally.lessonCount
      ? t("allWatchedShort")
      : t("timeLeft", { duration: runtimeLabel(tally.secondsLeft) });
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums lg:text-[0.8125rem]">
      {t("completedOfTotal", { completed: tally.completedCount, total: tally.lessonCount })}
      <span aria-hidden="true"> · </span>
      {remaining}
    </span>
  );
}
