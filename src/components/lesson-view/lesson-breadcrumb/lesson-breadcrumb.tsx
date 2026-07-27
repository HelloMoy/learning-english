import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { courseOverviewPath, moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The breadcrumb at the top of the Lesson Page. Three segments:
 * `Course › Module › Lesson`. The first two are locale-aware links to
 * the course and module overview pages; the Lesson is the current
 * page (no link).
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
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        <li>
          <Link
            href={courseOverviewPath(course) as never}
            className="hover:text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {course.title}
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li>
          <Link
            href={moduleOverviewPath(course, module) as never}
            className="hover:text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {module.title}
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li
          aria-current="page"
          className="font-semibold text-gold"
        >
          {lesson.title}
        </li>
      </ol>
    </nav>
  );
}
