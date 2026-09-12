"use server";

import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { LessonId } from "@/domain/entities/ids/ids";
import { actionClient } from "@/lib/safe-action/safe-action";

import { z } from "zod";

const lessonIdSchema = z.object({ lessonId: LessonId });

const playbackPositionSchema = z.object({
  lessonId: LessonId,
  seconds: z.number().finite().nonnegative(),
});

/**
 * Server Action invoked by the Lesson Page's "Mark as complete" button.
 *
 * Input is validated by `next-safe-action` against `lessonIdSchema` before
 * the body runs, so a malformed `lessonId` never reaches the use case and
 * comes back to the client as a typed `validationErrors` instead of a
 * thrown error. Delegates to `markLessonComplete` and reports whether the
 * write landed.
 *
 * In v1 the progress tracker is in-memory and ephemeral — see
 * `openspec/changes/2026-07-26-lesson-playback-resume/design.md`.
 *
 * @returns `{ data: { completed } }` on success; `validationErrors` when the
 *          input fails the schema
 */
export const markLessonCompleteAction = actionClient
  .inputSchema(lessonIdSchema)
  .action(async ({ parsedInput }) => {
    const deps = getCoursePlatformDeps();
    const result = await deps.useCases.markLessonComplete({ lessonId: parsedInput.lessonId });
    return { completed: result.isOk() };
  });

/**
 * Server Action invoked when the learner confirms un-marking a lesson.
 *
 * The inverse of {@link markLessonCompleteAction}, validated by the same
 * schema and delegating to `unmarkLessonComplete`. It reports whether the
 * clear landed rather than the lesson's new state: `{ completed: false }`
 * would read the same whether the write succeeded or the lesson was never
 * found, and the caller needs to tell those apart before it touches the
 * browser's own record.
 *
 * @returns `{ data: { unmarked } }` on success; `validationErrors` when the
 *          input fails the schema
 */
export const unmarkLessonCompleteAction = actionClient
  .inputSchema(lessonIdSchema)
  .action(async ({ parsedInput }) => {
    const deps = getCoursePlatformDeps();
    const result = await deps.useCases.unmarkLessonComplete({ lessonId: parsedInput.lessonId });
    return { unmarked: result.isOk() };
  });

/**
 * Server Action invoked by the video player wrapper on debounced and
 * lifecycle events. Persists the playback position for the current lesson
 * through the `PlaybackPositionRepository` port.
 *
 * The schema rejects a non-finite or negative `seconds` before any write,
 * so a `NaN` from a detached media element cannot poison the store.
 *
 * @returns `{ data: { recorded } }` on success; `validationErrors` when the
 *          input fails the schema
 */
export const recordPlaybackPositionAction = actionClient
  .inputSchema(playbackPositionSchema)
  .action(async ({ parsedInput }) => {
    const deps = getCoursePlatformDeps();
    const result = await deps.useCases.recordPlaybackPosition({
      lessonId: parsedInput.lessonId,
      seconds: parsedInput.seconds,
    });
    return { recorded: result.isOk() };
  });
