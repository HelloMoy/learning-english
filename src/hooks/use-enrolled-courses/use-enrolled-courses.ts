"use client";

import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { learnerStore, writeThrough } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Set` on each server render would loop.
 */
const EMPTY: ReadonlySet<string> = new Set();

function enrolledCourses(): ReadonlySet<string> {
  return learnerStore.getState().enrolledCourses;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server renders no learner state, so it must render no enrollments — and
 * the first client render has to agree, or React reports a hydration mismatch.
 *
 * @returns A stable empty set
 */
export function enrolledCoursesServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Every course the signed-in learner is enrolled in, as one snapshot of course
 * slugs.
 *
 * @remarks
 * A learner joins a course by enrolling from the course pages or by opening
 * one of its lessons (capability `course-enrollment`), and stays enrolled.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable set of course slugs; empty before hydration
 */
export function useEnrolledCourses(): ReadonlySet<string> {
  return useSyncExternalStore(
    learnerStore.subscribe,
    enrolledCourses,
    enrolledCoursesServerSnapshot,
  );
}

/**
 * Enrolls the learner in a course, and tells every surface.
 *
 * @remarks
 * Does nothing when the learner is already enrolled. Otherwise the course
 * shows at once and is withdrawn again when the server refuses — including
 * when the catalog does not serve that course.
 *
 * @param courseSlug - The slug of the course to join
 */
export function enrollInCourse(courseSlug: string): void {
  if (enrolledCourses().has(courseSlug)) return;
  void writeThrough(
    (state) => ({ enrolledCourses: new Set(state.enrolledCourses).add(courseSlug) }),
    async () => (await enrollInCourseAction({ courseSlug }))?.data?.enrolled === true,
  );
}
