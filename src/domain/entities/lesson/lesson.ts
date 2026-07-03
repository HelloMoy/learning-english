import { CourseId, LessonId } from "@/domain/entities/ids/ids";

import { z } from "zod";

/**
 * First lesson variant: a `reading` lesson with a markdown body.
 *
 * Future kinds (quiz, speaking, flashcards, ...) are added by extending this
 * discriminated union. The use cases narrow on `kind` to dispatch behavior.
 */
export const ReadingLesson = z.object({
  kind: z.literal("reading"),
  id: LessonId,
  courseId: CourseId,
  sequence: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const Lesson = z.discriminatedUnion("kind", [ReadingLesson]);

export type ReadingLesson = z.infer<typeof ReadingLesson>;
export type Lesson = z.infer<typeof Lesson>;
