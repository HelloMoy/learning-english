"use client";

import { PendingCoursePage } from "@/components/pending-course-page/pending-course-page";
import { useIsLearnerStoreSeeded } from "@/hooks/use-is-learner-store-seeded/use-is-learner-store-seeded";

import type { ReactNode } from "react";

/** Props for {@link CoursePageGate}. */
export type CoursePageGateProps = {
  /** The course title, the pending shape's level-one heading. */
  title: string;
  /** The page to show once the learner's state is known. */
  children: ReactNode;
};

/**
 * Holds a course page back until the learner store is seeded, showing
 * {@link PendingCoursePage} meanwhile (capability `course-detail-page`).
 *
 * @remarks
 * The course page reads the learner's enrollments to choose between **Enroll**
 * and its enrolled state. Before the store is seeded — on the server, and for
 * a moment in the browser — those enrollments read as empty, so without the
 * gate an enrolled learner would briefly be offered **Enroll**.
 *
 * Unlike `CoursePageSwitch`, the gate never swaps its children for another
 * page: it only waits.
 *
 * @example
 * ```tsx
 * <CoursePageGate title={course.title}>
 *   <CourseDetailView view={view} />
 * </CoursePageGate>
 * ```
 */
export function CoursePageGate({ title, children }: CoursePageGateProps) {
  const isSeeded = useIsLearnerStoreSeeded();

  if (!isSeeded) return <PendingCoursePage title={title} />;
  return children;
}
