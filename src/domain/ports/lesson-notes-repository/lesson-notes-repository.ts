import type { LessonId } from "@/domain/entities/ids/ids";
import type { Resource } from "@/domain/entities/resource/resource";

/**
 * The notes view the use case and the UI consume. The `Resource` is
 * included so the Lesson Page can still surface the original Markdown
 * source link in the Resources region.
 */
export type LessonNotes = {
  resource: Resource;
  markdown: string;
};

export interface LessonNotesRepository {
  /**
   * Returns the Markdown notes for the given lesson, or `null` when the
   * lesson has no Markdown resource. The implementation MUST NOT
   * accept or infer filesystem paths from caller input.
   */
  byLesson(lessonId: LessonId): Promise<LessonNotes | null>;
}
