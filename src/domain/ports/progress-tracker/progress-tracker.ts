import type { LessonId } from "@/domain/entities/ids/ids";

/**
 * Port: tracks which lessons the learner has completed.
 *
 * In v1 the only adapter is in-memory and the state is **ephemeral** (see
 * design.md §D6 and the spec `course-platform-domain` §
 * "markLessonComplete is ephemeral in v1"). When durable persistence arrives,
 * the adapter changes; the contract here does not.
 */
export interface ProgressTracker {
  markComplete(lessonId: LessonId): Promise<void>;
  isComplete(lessonId: LessonId): Promise<boolean>;
}
