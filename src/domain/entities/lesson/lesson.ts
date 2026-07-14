import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { urlOrRelativePath } from "@/domain/entities/url-or-path/url-or-path";

import { z } from "zod";

/**
 * A `reading` lesson — markdown body, no media. The first lesson kind.
 */
export const ReadingLesson = z.object({
  kind: z.literal("reading"),
  id: LessonId,
  courseId: CourseId,
  moduleId: ModuleId,
  sequence: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
});

/**
 * A `video` lesson — a Lecture. The primary content is a Video asset
 * referenced by `source` (a URL to an MP4 in v1; HLS in a future change).
 *
 * In user-facing copy the canonical term is _Lecture_ (see GLOSSARY.md).
 */
export const VideoLesson = z.object({
  kind: z.literal("video"),
  id: LessonId,
  courseId: CourseId,
  moduleId: ModuleId,
  sequence: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  source: urlOrRelativePath(),
  durationSeconds: z.number().int().positive(),
  poster: urlOrRelativePath().optional(),
});

/**
 * The Lesson discriminated union. Adding new kinds (quiz, speaking, ...)
 * is done by extending the union, not by introducing a parallel hierarchy.
 */
export const Lesson = z.discriminatedUnion("kind", [ReadingLesson, VideoLesson]);

export type ReadingLesson = z.infer<typeof ReadingLesson>;
export type VideoLesson = z.infer<typeof VideoLesson>;
export type Lesson = z.infer<typeof Lesson>;
