"use client";

import { Skeleton } from "@/components/ui/skeleton/skeleton";
import { useEnrolledCourses } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { learnerStore } from "@/lib/learner-store/learner-store";

import { useState, useSyncExternalStore, type ReactNode } from "react";

/** Which page the route settled on once the learner's enrollments were known. */
type Arrival = "unknown" | "enrolled" | "not-enrolled";

const isSeeded = () => learnerStore.getState().isSeeded;
const notSeededOnTheServer = () => false;

/** Props for {@link CoursePageSwitch}. */
export type CoursePageSwitchProps = {
  /** The course the route serves. */
  courseSlug: string;
  /** The course title, the pending shape's level-one heading. */
  title: string;
  /** The course page, for a learner who has not joined. */
  detail: ReactNode;
  /** The progress board, for a learner already enrolled. */
  board: ReactNode;
};

/**
 * Decides what the course route shows: the course page to a learner who has
 * not joined the course, the progress board to one who has (capabilities
 * `course-detail-page`, `cinema-course-overview`).
 *
 * @remarks
 * Enrollments live in the learner store, which is seeded on the client, so
 * until then the switch renders a pending shape that carries only the course
 * title. The decision is taken once, from the enrollments the store was seeded
 * with: a learner who enrolls from the course page keeps seeing it, now in its
 * enrolled state, rather than having the page swapped for the board under
 * them. Their next visit opens the board.
 *
 * Both candidates are rendered by the server and passed in, so the board stays
 * the same Server Component tree it was before this switch existed.
 *
 * @example
 * ```tsx
 * <CoursePageSwitch
 *   courseSlug={course.slug}
 *   title={course.title}
 *   detail={<CourseDetailView view={view} />}
 *   board={<CourseOverview {...view} />}
 * />
 * ```
 */
export function CoursePageSwitch({ courseSlug, title, detail, board }: CoursePageSwitchProps) {
  const arrival = useArrival(courseSlug);

  if (arrival === "enrolled") return board;
  if (arrival === "not-enrolled") return detail;
  return <PendingCoursePage title={title} />;
}

function useArrival(courseSlug: string): Arrival {
  const seeded = useSyncExternalStore(learnerStore.subscribe, isSeeded, notSeededOnTheServer);
  const isEnrolled = useEnrolledCourses().has(courseSlug);
  const [arrival, setArrival] = useState<Arrival>("unknown");

  // Adjusting state while rendering (React's pattern for remembering a past
  // render): the first seeded render fixes the page for the rest of the visit.
  if (seeded && arrival === "unknown") {
    const settled = isEnrolled ? "enrolled" : "not-enrolled";
    setArrival(settled);
    return settled;
  }
  return arrival;
}

function PendingCoursePage({ title }: { title: string }) {
  return (
    <div
      data-testid="course-page-pending"
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-4 sm:px-11 lg:pt-5"
    >
      <div className="relative flex min-h-[28rem] flex-col justify-end gap-3 overflow-hidden rounded-[22px] border border-border p-5 pt-16 sm:p-7 sm:pt-24 lg:aspect-[21/9] lg:min-h-0 lg:rounded-[26px] lg:p-8">
        <Skeleton className="h-3 w-56" />
        <h1 className="max-w-[18ch] text-[2.25rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[3.25rem]">
          {title}
        </h1>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-[18px]" />
    </div>
  );
}
