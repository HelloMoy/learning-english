/**
 * Use case: mark a lesson as complete.
 */
export type MarkLessonComplete = (lessonId: string) => Promise<{ completed: true }>;

/**
 * Build the use case from its dependencies.
 *
 * @param markComplete - Writes the completion through the progress port.
 * @returns The use case.
 */
export function makeMarkLessonComplete(
  markComplete: (lessonId: string) => Promise<void>,
): MarkLessonComplete {
  return async (lessonId) => {
    await markComplete(lessonId);
    return { completed: true };
  };
}
