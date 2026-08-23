"use server";

import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { LessonId } from "@/domain/entities/ids/ids";

import { z } from "zod";

const lessonIdSchema = z.object({ lessonId: LessonId });

const playbackPositionSchema = z.object({
  lessonId: LessonId,
  seconds: z.number().finite().nonnegative(),
});

export type MarkLessonCompleteResult = { completed: boolean };

/**
 * Server Action invoked by the Lesson Page's "Mark as complete" button.
 *
 * Input is validated at the boundary with Zod (same schema as `LessonId`).
 * Delegates to `markLessonComplete` and translates the `Result` into the
 * boolean the UI consumes. In v1 the in-memory tracker is ephemeral — see
 * `openspec/changes/2026-07-26-lesson-playback-resume/design.md`.
 */
export async function markLessonCompleteAction(input: {
  lessonId: LessonId;
}): Promise<MarkLessonCompleteResult> {
  const parsed = lessonIdSchema.safeParse(input);
  if (!parsed.success) {
    return { completed: false };
  }
  const deps = getCoursePlatformDeps();
  const result = await deps.useCases.markLessonComplete({ lessonId: parsed.data.lessonId });
  if (result.isErr()) {
    return { completed: false };
  }
  return { completed: true };
}

export type RecordPlaybackPositionResult = { recorded: boolean };

/**
 * Server Action invoked by the video player wrapper on debounced and
 * lifecycle events. Persists the playback position for the current lesson
 * via the `PlaybackPositionRepository` port. Bounds the input through Zod
 * — a non-finite or negative `seconds` is rejected without writing.
 */
export async function recordPlaybackPositionAction(input: {
  lessonId: LessonId;
  seconds: number;
}): Promise<RecordPlaybackPositionResult> {
  const parsed = playbackPositionSchema.safeParse(input);
  if (!parsed.success) {
    return { recorded: false };
  }
  const deps = getCoursePlatformDeps();
  const result = await deps.useCases.recordPlaybackPosition({
    lessonId: parsed.data.lessonId,
    seconds: parsed.data.seconds,
  });
  if (result.isErr()) {
    return { recorded: false };
  }
  return { recorded: true };
}
