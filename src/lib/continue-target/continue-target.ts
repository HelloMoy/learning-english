import type { LessonId } from "@/domain/entities/ids/ids";
import { countsAsComplete, watchedFraction } from "@/lib/watch-progress/watch-progress";

const NOT_FOUND = -1;
const FIRST_VIDEO = 0;

/** One video of an ordered list: which lesson it is and how long it runs. */
export type ContinueVideo = {
  id: LessonId;
  durationSeconds: number;
};

/**
 * The learner's progress on this device, and the video they opened last.
 *
 * @remarks
 * `lastOpenedLessonId` is the lesson recorded by the continue-watching
 * capability. It may name a video outside the list; the rule then ignores it.
 */
export type LearnerProgress = {
  completedLessonIds: ReadonlySet<string>;
  positions: ReadonlyMap<string, number>;
  lastOpenedLessonId?: LessonId;
};

/**
 * The video a learner continues with, as an index into the list, and why.
 *
 * - `none` — the list holds no videos.
 * - `start` — nothing is watched and no record names a video of the list; the first video.
 * - `continue` — the anchor, or the first unfinished video after (or, failing that, before) it.
 * - `rewatch` — every video is finished; the first video, to watch again.
 */
export type ContinueTarget =
  { kind: "none" } | { kind: "start" | "continue" | "rewatch"; index: number };

/**
 * Picks the video a learner continues with. **The single source of truth** for
 * that question: every surface that offers to continue calls this function
 * rather than reading the continue-watching record directly.
 *
 * @remarks
 * Specified by the `continue-target` capability. The rule finds an **anchor** —
 * the last opened video when it belongs to the list, otherwise the furthest
 * video with any progress — then keeps the anchor when it is unfinished, or
 * moves to the first unfinished video after it, or, when none follows, to the
 * first unfinished video of the list. A finished recorded video is therefore
 * never offered again.
 *
 * Callers pass the videos **in learning order** — one module's lessons in
 * `sequence` order, or a whole course with its modules and their lessons in
 * `sequence` order. The function never sorts.
 *
 * Completion uses `countsAsComplete` and progress uses `watchedFraction`, the
 * rules every progress indicator shares.
 *
 * Callers: `deriveModuleRoute` (the module overview's featured step),
 * `courseOverviewProgress` (the course overview's continue tile) and
 * `useCourseContinueTarget` (My learning's resume panel and lead lesson card).
 * The lesson page's Up next answers a different question — the video after the
 * one open — and does not use it.
 *
 * @example
 * ```ts
 * const target = findContinueTarget(videos, { completedLessonIds, positions, lastOpenedLessonId });
 * if (target.kind !== "none") openVideo(videos[target.index]);
 * ```
 *
 * @param videos - The videos in learning order
 * @param progress - Completion marks, playback positions and the last opened video
 * @returns The video to continue with, or `none` for an empty list
 */
export function findContinueTarget(
  videos: ReadonlyArray<ContinueVideo>,
  progress: LearnerProgress,
): ContinueTarget {
  if (videos.length === 0) return { kind: "none" };

  const finished = videos.map((video) => isFinished(video, progress));
  if (finished.every(Boolean)) return { kind: "rewatch", index: FIRST_VIDEO };

  const anchor = anchorIndex(videos, finished, progress);
  if (anchor === NOT_FOUND) return { kind: "start", index: FIRST_VIDEO };

  return { kind: "continue", index: unfinishedFrom(finished, anchor) };
}

function isFinished(video: ContinueVideo, progress: LearnerProgress): boolean {
  return countsAsComplete({
    isMarkedComplete: progress.completedLessonIds.has(video.id),
    positionSeconds: progress.positions.get(video.id) ?? null,
    durationSeconds: video.durationSeconds,
  });
}

function anchorIndex(
  videos: ReadonlyArray<ContinueVideo>,
  finished: ReadonlyArray<boolean>,
  progress: LearnerProgress,
): number {
  const lastOpened = videos.findIndex((video) => video.id === progress.lastOpenedLessonId);
  return lastOpened !== NOT_FOUND ? lastOpened : furthestProgressIndex(videos, finished, progress);
}

function furthestProgressIndex(
  videos: ReadonlyArray<ContinueVideo>,
  finished: ReadonlyArray<boolean>,
  progress: LearnerProgress,
): number {
  return videos.reduce(
    (furthest, video, index) => (hasProgress(video, finished[index]!, progress) ? index : furthest),
    NOT_FOUND,
  );
}

function hasProgress(
  video: ContinueVideo,
  isVideoFinished: boolean,
  progress: LearnerProgress,
): boolean {
  const positionSeconds = progress.positions.get(video.id) ?? null;
  return isVideoFinished || watchedFraction(positionSeconds, video.durationSeconds) > 0;
}

function unfinishedFrom(finished: ReadonlyArray<boolean>, anchor: number): number {
  if (!finished[anchor]) return anchor;
  const next = finished.findIndex((isVideoFinished, index) => index > anchor && !isVideoFinished);
  return next !== NOT_FOUND ? next : finished.findIndex((isVideoFinished) => !isVideoFinished);
}
