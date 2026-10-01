"use client";

import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useContinueWatchingByCourse } from "@/hooks/use-continue-watching-by-course/use-continue-watching-by-course";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import {
  courseOverviewEntries,
  courseOverviewProgress,
} from "@/lib/course-overview-progress/course-overview-progress";
import type { TargetVideo } from "@/lib/course-shelf/course-shelf";

/**
 * Client hook: the video the learner continues a course with, decided exactly
 * as the course overview's continue tile decides it (capability
 * `continue-target`).
 *
 * @remarks
 * Reads this learner's completion marks, playback positions and the course's
 * own continue-watching record from the learner store, and hands them to
 * `courseOverviewProgress` — the rule the board uses — so any surface built on
 * this hook opens the same video as the board.
 *
 * Before the learner store is seeded every slice reads empty, so the target is
 * the course's first video with kind `start`. Gate on
 * `useIsLearnerStoreSeeded` where that would mislead.
 *
 * @example
 * ```tsx
 * const target = useCourseContinueTarget(view);
 * if (target?.kind === "continue") return <Link href={lessonPath(course, target.module, target.lesson)} />;
 * ```
 *
 * @param view - The course, its lessons and their videos
 * @returns The video to open and why (`start`, `continue` or `rewatch`), or `null` for a course with no videos
 */
export function useCourseContinueTarget(view: CourseForView): TargetVideo | null {
  const records = useContinueWatchingByCourse();
  const completedIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  const { course } = view;
  const ownRecord = records.find((record) => record.location.courseSlug === course.slug);

  const { continueTarget } = courseOverviewProgress({
    course,
    entries: courseOverviewEntries(view.modules, view.moduleSummaries),
    location: ownRecord?.location ?? null,
    completedIds,
    positions,
  });
  return continueTarget.kind === "none" ? null : continueTarget;
}
