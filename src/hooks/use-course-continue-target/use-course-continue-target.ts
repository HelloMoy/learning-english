"use client";

import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import {
  resolveContinueWatchingPanel,
  type ResolveContinueWatching,
} from "@/app/[locale]/resolve-continue-watching";
import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import type { ResolvedContinueWatching } from "@/hooks/use-resolved-continue-watching/use-resolved-continue-watching";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { findContinueTarget } from "@/lib/continue-target/continue-target";

import { useEffect, useState } from "react";

/** The course being continued, as the catalog projects it. */
export type ContinueCourse = {
  course: Pick<Course, "slug">;
  modules: ReadonlyArray<Pick<Module, "id" | "slug">>;
  /** Every lesson's progress slice, in learning order. */
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
};

/** The answer for one resolved target location. */
type TargetAnswer = { lessonId: LessonId; panel: ContinueWatchingPanel | null };

/**
 * Client hook: turns the resolved continue-watching record into the video the
 * learner should actually continue with — the course's continue target.
 *
 * @remarks
 * The record names the video opened last, which may already be finished.
 * This hook runs {@link findContinueTarget} — the single rule every continue
 * surface shares — over the continued course's videos, with that video as the
 * last opened one. When the target is the recorded video, the record's panel
 * is returned as is, with no second round-trip. When it is another video, that
 * video's location is resolved through the same server action and the hook
 * reports `resolving` until it answers. Should that answer be empty, the
 * record's panel is kept rather than offering nothing.
 *
 * A record that is not resolved yet (`none` or `resolving`) passes through.
 *
 * Browser-side only — progress lives in `localStorage`.
 *
 * @see findContinueTarget
 *
 * @example
 * ```tsx
 * const lastLesson = useResolvedContinueWatching();
 * const target = useCourseContinueTarget({ course: level, lastLesson });
 * if (target.status === "resolved") return <ResumePanel panel={target.panel} ... />;
 * ```
 *
 * @param options.course - The continued course's slug, modules and lesson slices
 * @param options.lastLesson - The resolved continue-watching record
 * @param options.resolve - Overrides the resolver; defaults to the Server Action
 * @returns The continue target's resolution, in the record's own shape
 */
export function useCourseContinueTarget({
  course,
  lastLesson,
  resolve = resolveContinueWatchingPanel,
}: {
  course: ContinueCourse;
  lastLesson: ResolvedContinueWatching;
  resolve?: ResolveContinueWatching;
}): ResolvedContinueWatching {
  const completedLessonIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  const location =
    lastLesson.status === "resolved"
      ? targetLocation(course, lastLesson.lessonId, { completedLessonIds, positions })
      : null;
  const answer = useTargetAnswer(location, resolve);

  if (lastLesson.status !== "resolved" || location === null) return lastLesson;
  if (answer?.lessonId !== location.lessonId) return { status: "resolving" };
  return answer.panel
    ? { status: "resolved", panel: answer.panel, lessonId: answer.lessonId }
    : lastLesson;
}

/**
 * Where the continue target lives, or `null` when the target is the recorded
 * video itself (or the course holds no videos) and nothing more needs resolving.
 */
function targetLocation(
  { course, modules, lessonRuntimes }: ContinueCourse,
  recordedLessonId: LessonId,
  progress: { completedLessonIds: ReadonlySet<string>; positions: ReadonlyMap<string, number> },
): ContinueWatchingLocation | null {
  const target = findContinueTarget(lessonRuntimes, {
    ...progress,
    lastOpenedLessonId: recordedLessonId,
  });
  if (target.kind === "none") return null;
  const slice = lessonRuntimes[target.index]!;
  if (slice.id === recordedLessonId) return null;
  const moduleSlug = modules.find((module) => module.id === slice.moduleId)?.slug;
  return moduleSlug ? { courseSlug: course.slug, moduleSlug, lessonId: slice.id } : null;
}

function useTargetAnswer(
  location: ContinueWatchingLocation | null,
  resolve: ResolveContinueWatching,
): TargetAnswer | null {
  const [answer, setAnswer] = useState<TargetAnswer | null>(null);
  const courseSlug = location?.courseSlug;
  const moduleSlug = location?.moduleSlug;
  const lessonId = location?.lessonId;

  useEffect(() => {
    if (!courseSlug || !moduleSlug || !lessonId) return;
    let isCurrent = true;
    void resolve({ courseSlug, moduleSlug, lessonId }).then((panel) => {
      if (isCurrent) setAnswer({ lessonId, panel });
    });
    return () => {
      isCurrent = false;
    };
  }, [courseSlug, moduleSlug, lessonId, resolve]);

  return answer;
}
