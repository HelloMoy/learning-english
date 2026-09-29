"use client";

import { CourseCinemaHero } from "@/components/course-cinema-hero/course-cinema-hero";
import { CourseShelfCard } from "@/components/course-shelf-card/course-shelf-card";
import { EnrolledCourseCard } from "@/components/enrolled-course-card/enrolled-course-card";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCourseShelf, type CourseShelfReading } from "@/hooks/use-course-shelf/use-course-shelf";
import { cn } from "@/lib/utils/utils";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type ReadShelf = Extract<CourseShelfReading, { status: "read" }>;

/** Props for {@link AvailableCoursesView}. */
export type AvailableCoursesViewProps = {
  /** Every catalog course's view, in catalog order. */
  courses: ReadonlyArray<CourseForView>;
};

/**
 * Available courses: the course the learner watched last, their other
 * courses, and the courses they have not joined yet.
 *
 * @remarks
 * The lead is a wide cinema frame (see {@link CourseCinemaHero}): the enrolled
 * course watched most recently, or, for a learner enrolled in nothing, the
 * first catalog course as a recommendation. **Your other courses** follows only
 * when there are any. **More courses** always renders, and says so when the
 * learner has joined everything, so the page's shape does not jump.
 *
 * The heading renders on the server; the sections wait for the learner's
 * state, and **Enroll** moves a course between sections at once.
 *
 * @example
 * ```tsx
 * <AvailableCoursesView courses={await loadCourseViews()} />
 * ```
 */
export function AvailableCoursesView({ courses }: AvailableCoursesViewProps) {
  const t = useTranslations("Components.AvailableCoursesView");
  const shelf = useCourseShelf(courses);

  return (
    <section
      data-testid="available-courses"
      className="flex flex-col gap-7 sm:gap-9"
    >
      <header className="flex flex-col gap-2">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-sans text-[2rem] leading-[1.02] font-black tracking-[-0.035em] text-balance text-foreground sm:text-5xl">
          {t("heading")}
        </h1>
        {shelf.status === "read" ? (
          <p className="text-muted-foreground">
            <Summary
              total={courses.length}
              enrolled={shelf.enrolledCount}
            />
          </p>
        ) : null}
      </header>
      {shelf.status === "read" ? <ShelfSections shelf={shelf} /> : <PendingSections />}
    </section>
  );
}

function Summary({ total, enrolled }: { total: number; enrolled: number }) {
  const t = useTranslations("Components.AvailableCoursesView");
  return enrolled > 0 && enrolled === total
    ? t("summaryAll", { total })
    : t("summary", { total, enrolled });
}

function ShelfSections({ shelf }: { shelf: ReadShelf }) {
  const t = useTranslations("Components.AvailableCoursesView");
  return (
    <div className="flex flex-col gap-10">
      {shelf.featured ? (
        <CourseCinemaHero
          model={shelf.featured}
          label={shelf.isFeaturedWatched ? "last-watched" : "your-course"}
        />
      ) : shelf.recommended ? (
        <CourseCinemaHero
          model={shelf.recommended}
          label="recommended"
        />
      ) : null}
      {shelf.otherEnrolled.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionHeading
            eyebrow={t("otherCoursesEyebrow")}
            title={t("otherCoursesHeading", { count: shelf.otherEnrolled.length })}
          />
          <div className={cn("grid gap-3.5", shelf.otherEnrolled.length > 1 && "lg:grid-cols-2")}>
            {shelf.otherEnrolled.map((model) => (
              <EnrolledCourseCard
                key={model.course.id}
                model={model}
              />
            ))}
          </div>
        </section>
      ) : null}
      <section className="flex flex-col gap-4">
        <SectionHeading
          eyebrow={t("moreCoursesEyebrow")}
          title={
            shelf.highestEnrolledLevel === null
              ? t("moreCoursesStartHere")
              : t("moreCoursesHeading", { level: shelf.highestEnrolledLevel })
          }
        />
        {shelf.available.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {shelf.available.map((view) => (
              <CourseShelfCard
                key={view.course.id}
                view={view}
              />
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-3 rounded-[18px] border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
            <CircleCheck
              aria-hidden="true"
              className="size-5 shrink-0 text-gold"
            />
            {t.rich("everyCourseJoined", {
              strong: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>,
            })}
          </p>
        )}
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[1.375rem] leading-tight font-black tracking-[-0.025em] text-foreground">
        {title}
      </h2>
    </div>
  );
}

function PendingSections() {
  return (
    <div
      data-testid="available-courses-pending"
      className="flex flex-col gap-10"
    >
      <Skeleton className="h-[26rem] w-full rounded-[26px] lg:aspect-[21/9] lg:h-auto" />
      <Skeleton className="h-40 w-full rounded-[22px]" />
    </div>
  );
}
