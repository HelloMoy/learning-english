import type { CourseStanding } from "@/domain/entities/course-standing/course-standing";
import type { Course } from "@/domain/entities/course/course";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { courseCopy } from "@/lib/course-copy/course-copy";
import { cn } from "@/lib/utils/utils";

import { useLocale, useTranslations } from "next-intl";

/** One catalog course and where it stands: a numbered level, or reference material. */
export type StandingCourse = {
  course: Course;
  standing: CourseStanding;
};

/** The course being continued, and how many of its videos are complete. */
export type ContinuedCourse = {
  courseSlug: string;
  completedCount: number;
};

/**
 * Catalog courses as rows of an ordered table: the levels, or the reference
 * courses that sit outside them.
 *
 * @remarks
 * Rows are ordered by `Course.sequence`, whatever order they arrive in, and
 * every course gets the same row — no course is dropped or given a slot the
 * others cannot have. Each row carries exactly one link, to its course
 * overview. A row's ordinal comes from its standing — `Level {n}` or
 * `Reference` — never from `Course.sequence`.
 *
 * The row for the course being continued says so and states its progress; its
 * link invites the learner to continue rather than to view. Every other row is
 * unchanged.
 *
 * @param courses - The courses to list with their standings, in any order
 * @param continued - The course being continued, or `null` for a new visitor
 * @param listing - Which table this is, which names it for assistive technology; `levels` by default
 */
export function LevelsTable({
  courses,
  continued,
  listing = "levels",
}: {
  courses: ReadonlyArray<StandingCourse>;
  continued: ContinuedCourse | null;
  listing?: "levels" | "reference";
}) {
  const t = useTranslations("Components.LevelsTable");
  const inSequence = [...courses].sort((a, b) => a.course.sequence - b.course.sequence);

  return (
    <ol
      aria-label={t(listing === "reference" ? "referenceTableLabel" : "tableLabel")}
      className="flex flex-col border-t-2 border-foreground"
    >
      {inSequence.map(({ course, standing }) => (
        <LevelRow
          key={course.id}
          course={course}
          standing={standing}
          completedCount={course.slug === continued?.courseSlug ? continued.completedCount : null}
        />
      ))}
    </ol>
  );
}

function LevelRow({
  course,
  standing,
  completedCount,
}: StandingCourse & { completedCount: number | null }) {
  const t = useTranslations("Components.LevelsTable");
  const { description } = courseCopy(course, useLocale());
  const isContinued = completedCount !== null;

  return (
    <li className="grid grid-cols-1 gap-2.5 border-b border-border py-6 lg:grid-cols-[7.5rem_minmax(0,1.2fr)_minmax(0,1.4fr)_12.5rem_11.25rem] lg:items-center lg:gap-6 lg:py-8">
      <span className="text-[11px] font-bold tracking-[0.3em] text-gold uppercase lg:text-xs lg:tracking-[0.32em]">
        {standing.kind === "level"
          ? t("levelOrdinal", { number: standing.number })
          : t("referenceOrdinal")}
      </span>
      <h3 className="font-sans text-[1.375rem] font-extrabold tracking-tight text-foreground lg:text-[1.75rem]">
        {course.title}
      </h3>
      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>
      <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-start">
        {isContinued ? (
          <span className="rounded-md border border-gold/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
            {t("inProgress")}
          </span>
        ) : null}
        <span className="text-[13px] text-muted-foreground">
          {isContinued
            ? t("progress", { completed: completedCount, total: course.lessonCount })
            : t("counts", { lessons: course.moduleCount, videos: course.lessonCount })}
        </span>
      </div>
      <Link
        href={courseOverviewPath(course) as never}
        className={cn(
          "mt-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:mt-0",
        )}
      >
        {isContinued ? t("continueCourse") : t("viewCourse")}
      </Link>
    </li>
  );
}
