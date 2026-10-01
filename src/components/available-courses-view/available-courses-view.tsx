"use client";

import { CoursePoster } from "@/components/course-poster/course-poster";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { NextUpBar } from "@/components/next-up-bar/next-up-bar";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCourseShelf, type CourseShelfReading } from "@/hooks/use-course-shelf/use-course-shelf";
import { courseLobby } from "@/lib/course-lobby/course-lobby";

import { useTranslations } from "next-intl";

type ReadShelf = Extract<CourseShelfReading, { status: "read" }>;

/** Props for {@link AvailableCoursesView}. */
export type AvailableCoursesViewProps = {
  /** Every catalog course's view, in catalog order. */
  courses: ReadonlyArray<CourseForView>;
};

/** How many poster placeholders stand in while the learner's state is read. */
const PENDING_POSTERS = 3;

const LOBBY_GRID = "grid grid-cols-1 gap-4 lg:grid-cols-3";

/**
 * Available courses: every catalog course as an equal poster, the learner's
 * own courses first.
 *
 * @remarks
 * The lobby leads with the enrolled course watched most recently, then the
 * learner's other courses, then every course they have not joined in catalog
 * order (see {@link courseLobby}); each is a {@link CoursePoster}. A learner
 * enrolled in nothing also sees a {@link NextUpBar} above the heading for the
 * first level course; it leaves as soon as they join any course.
 *
 * The heading renders on the server; the bar and the posters wait for the
 * learner's state, and **Enroll** turns a poster at once.
 *
 * @example
 * ```tsx
 * <AvailableCoursesView courses={await loadCourseViews()} />
 * ```
 */
export function AvailableCoursesView({ courses }: AvailableCoursesViewProps) {
  const t = useTranslations("Components.AvailableCoursesView");
  const shelf = useCourseShelf(courses);
  const isRead = shelf.status === "read";

  return (
    <section
      data-testid="available-courses"
      className="flex flex-col gap-7 sm:gap-9"
    >
      {isRead && shelf.recommended ? <NextUpBar model={shelf.recommended} /> : null}
      <header className="flex flex-col gap-2">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-sans text-[2rem] leading-[1.02] font-black tracking-[-0.035em] text-balance text-foreground sm:text-5xl">
          {t("heading")}
        </h1>
        {isRead ? (
          <p className="text-muted-foreground">
            <Summary
              total={courses.length}
              enrolled={shelf.enrolledCount}
            />
          </p>
        ) : null}
      </header>
      {isRead ? (
        <Lobby
          shelf={shelf}
          courses={courses}
        />
      ) : (
        <PendingLobby />
      )}
    </section>
  );
}

function Summary({ total, enrolled }: { total: number; enrolled: number }) {
  const t = useTranslations("Components.AvailableCoursesView");
  return enrolled > 0 && enrolled === total
    ? t("summaryAll", { total })
    : t("summary", { total, enrolled });
}

function Lobby({ shelf, courses }: { shelf: ReadShelf; courses: ReadonlyArray<CourseForView> }) {
  const enrolled = [...(shelf.featured ? [shelf.featured] : []), ...shelf.otherEnrolled];

  return (
    <div className={LOBBY_GRID}>
      {courseLobby(enrolled, courses).map((entry) => (
        <CoursePoster
          key={entry.kind === "enrolled" ? entry.model.course.id : entry.view.course.id}
          entry={entry}
        />
      ))}
    </div>
  );
}

function PendingLobby() {
  return (
    <div
      data-testid="available-courses-pending"
      className={LOBBY_GRID}
    >
      {Array.from({ length: PENDING_POSTERS }, (_, index) => (
        <Skeleton
          key={index}
          className="h-[22rem] w-full rounded-[22px] lg:aspect-[3/4] lg:h-auto"
        />
      ))}
    </div>
  );
}
