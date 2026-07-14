import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The breadcrumb at the top of the Lesson Page. Three segments:
 * `Course › Module › Lesson`. The first two are locale-aware links; the
 * Lesson is the current page (no link).
 */
export function LessonBreadcrumb({
  course,
  module,
  lesson,
}: {
  course: Course;
  module: Module;
  lesson: Lesson;
}) {
  const t = useTranslations("Components.LessonBreadcrumb");
  return (
    <nav
      aria-label={t("ariaLabel")}
      className="text-sm"
    >
      <ol className="flex flex-wrap items-center gap-1 text-slate-600 dark:text-slate-400">
        <li>
          <Link
            href={`/courses/${course.slug}`}
            className="hover:underline"
          >
            {course.title}
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li>
          <Link
            href={`/courses/${course.slug}/modules/${module.slug}/lessons/${lesson.id}`}
            className="hover:underline"
          >
            {module.title}
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li
          aria-current="page"
          className="font-medium text-slate-900 dark:text-slate-100"
        >
          {lesson.title}
        </li>
      </ol>
    </nav>
  );
}
