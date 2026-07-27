import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * A module's lessons in `sequence` order, each a locale-aware link to the
 * lesson route. The current lesson is marked with `aria-current="page"` and
 * a visual indicator. Each row uses the project's standard minimum touch
 * target height and a visible focus ring.
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
              href={lessonPath(course, module, lesson) as never}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={isCurrent ? t("currentLessonAria") : undefined}
              className={
                isCurrent
                  ? "block min-h-9 rounded border-l-2 border-gold bg-gold/10 px-2 py-2 text-sm font-semibold text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  : "block min-h-9 rounded px-2 py-2 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
