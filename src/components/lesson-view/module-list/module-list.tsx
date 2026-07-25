import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { LessonList } from "../lesson-list/lesson-list";

/**
 * Renders the course's modules in `sequence` order, each with its lessons
 * listed below. `lessonsByModuleId` is the precomputed map of moduleId →
 * lessons (sorted by sequence) that the page passes in.
 *
 * The current module is open by default; inactive modules are collapsed
 * with a link to their module overview so the learner can navigate
 * without expanding every lesson row.
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
  const currentModuleId = modules.find((mod) =>
    (lessonsByModuleId.get(mod.id) ?? []).some((lesson) => lesson.id === currentLessonId),
  )?.id;
  return (
    <ol className="space-y-3">
      {modules.map((mod) => {
        const lessons = lessonsByModuleId.get(mod.id) ?? [];
        const isOpen = mod.id === currentModuleId;
        return (
          <li
            key={mod.id}
            className="space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href={moduleOverviewPath(course, mod) as never}
                aria-current={isOpen ? "true" : undefined}
                className="text-sm font-semibold text-slate-700 hover:underline focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring dark:text-slate-300"
              >
                {mod.title}
              </Link>
            </div>
            {isOpen ? (
              <LessonList
                course={course}
                module={mod}
                lessons={lessons}
                currentLessonId={currentLessonId}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
