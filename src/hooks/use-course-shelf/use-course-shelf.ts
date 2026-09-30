"use client";

import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useContinueWatchingByCourse } from "@/hooks/use-continue-watching-by-course/use-continue-watching-by-course";
import { useEnrolledCourses } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useClaimedPrizes } from "@/hooks/use-prize-claims/use-prize-claims";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import {
  courseCardModel,
  courseShelf,
  type CourseCardModel,
  type ShelfCourse,
} from "@/lib/course-shelf/course-shelf";
import { learnerStore } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/**
 * The catalog sorted for the signed-in learner, with a card model for every
 * course they are enrolled in; `pending` until their state is adopted.
 *
 * @category Course shelf
 */
export type CourseShelfReading =
  | { status: "pending" }
  | {
      status: "read";
      /** The enrolled course to lead with, or `null` with no enrollment. */
      featured: CourseCardModel | null;
      /** Whether the learner has been in the featured course at all. */
      isFeaturedWatched: boolean;
      otherEnrolled: CourseCardModel[];
      /** With no enrollment, the first level course; otherwise `null`. */
      recommended: CourseCardModel | null;
      available: CourseForView[];
      enrolledCount: number;
      /** The highest derived level enrolled in, or `null` when no level course is enrolled. */
      highestEnrolledLevel: number | null;
    };

const isSeeded = () => learnerStore.getState().isSeeded;
const notSeededOnTheServer = () => false;

/**
 * Reads the learner's enrollments, places, completion marks, positions and
 * claimed prizes once, and sorts the catalog with them.
 *
 * @remarks
 * Every learner page reads the catalog through this hook, so Available
 * courses and My learning always agree on which course leads and which video
 * comes next. Browser-side only.
 *
 * @param courses - Every catalog course's view, as the page loaded them
 * @returns The shelf, or `pending` before hydration
 *
 * @category Course shelf
 */
export function useCourseShelf(courses: ReadonlyArray<CourseForView>): CourseShelfReading {
  const seeded = useSyncExternalStore(learnerStore.subscribe, isSeeded, notSeededOnTheServer);
  const enrolledSlugs = useEnrolledCourses();
  const records = useContinueWatchingByCourse();
  const completedIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  const claimedPrizes = useClaimedPrizes();

  if (!seeded) return { status: "pending" };

  const shelf = courseShelf({ courses, enrolledSlugs, records, completedIds, positions });
  const modelOf = (course: ShelfCourse) => courseCardModel(course, { positions, claimedPrizes });
  const enrolled = [shelf.featured, ...shelf.otherEnrolled].flatMap((course) =>
    course ? [course] : [],
  );

  return {
    status: "read",
    featured: shelf.featured ? modelOf(shelf.featured) : null,
    isFeaturedWatched: Boolean(shelf.featured?.record),
    otherEnrolled: shelf.otherEnrolled.map(modelOf),
    recommended: shelf.recommended ? modelOf(shelf.recommended) : null,
    available: shelf.available,
    enrolledCount: enrolled.length,
    highestEnrolledLevel: highestLevelOf(enrolled),
  };
}

function highestLevelOf(enrolled: ReadonlyArray<ShelfCourse>): number | null {
  const levels = enrolled.flatMap(({ view: { standing } }) =>
    standing.kind === "level" ? [standing.number] : [],
  );
  return levels.length > 0 ? Math.max(...levels) : null;
}
