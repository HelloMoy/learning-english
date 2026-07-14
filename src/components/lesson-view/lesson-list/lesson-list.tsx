import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * A module's lessons in `sequence` order, each a locale-aware link to the
 * lesson route. The current lesson is marked with `aria-current="page"` and
 * a visual indicator.
 */
export function LessonList({
  course,
  module,
  lessons,
  currentLessonId,
}: {
  course: Course;
  module: Module;
  lessons: Lesson[];
  currentLessonId: LessonId;
}) {
  const t = useTranslations("Components.LessonList");
  return (
    <ul className="space-y-1 pl-2">
      {lessons.map((lesson) => {
        const isCurrent = lesson.id === currentLessonId;
        return (
          <li key={lesson.id}>
            <Link
              href={`/courses/${course.slug}/modules/${module.slug}/lessons/${lesson.id}`}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={isCurrent ? t("currentLessonAria") : undefined}
              className={
                isCurrent
                  ? "block rounded bg-slate-200 px-2 py-1 text-sm font-medium text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                  : "block rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            >
              {lesson.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
