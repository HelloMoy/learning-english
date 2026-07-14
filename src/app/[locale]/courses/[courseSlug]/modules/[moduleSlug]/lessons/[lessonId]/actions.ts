"use server";

import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import type { LessonId } from "@/domain/entities/ids/ids";

/**
 * Server Action invoked by the Lesson Page's "Mark as complete" button.
 * Delegates to the `markLessonComplete` use case. In v1 the in-memory
 * tracker is ephemeral — see GLOSSARY.md § Deferred to a future change.
 */
export async function markLessonCompleteAction(input: {
  lessonId: LessonId;
}): Promise<{ completed: boolean }> {
  const deps = getCoursePlatformDeps();
  const result = await deps.useCases.markLessonComplete({ lessonId: input.lessonId });
  if (result.isErr()) {
    return { completed: false };
  }
  return { completed: true };
}
