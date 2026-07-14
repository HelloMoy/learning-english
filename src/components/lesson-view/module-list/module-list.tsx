import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

import { LessonList } from "../lesson-list/lesson-list";

/**
 * Renders the course's modules in `sequence` order, each with its lessons
 * listed below. `lessonsByModuleId` is the precomputed map of moduleId →
 * lessons (sorted by sequence) that the page passes in.
 */
export function ModuleList({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
}: {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
}) {
  return (
    <ol className="space-y-3">
      {modules.map((mod) => {
        const lessons = lessonsByModuleId.get(mod.id) ?? [];
        return (
          <li key={mod.id}>
            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {mod.title}
            </h3>
            <LessonList
              course={course}
              module={mod}
              lessons={lessons}
              currentLessonId={currentLessonId}
            />
          </li>
        );
      })}
    </ol>
  );
}
