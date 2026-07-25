import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Convert a video lesson duration to a one-line minute label. Reading
 * lessons don't have a duration; in that case we return `null` so the
 * caller can omit the duration column.
 */
function lessonDurationMinutes(lesson: Lesson): number | null {
  if (lesson.kind !== "video") return null;
  return Math.max(1, Math.round(lesson.durationSeconds / 60));
}

/**
 * Renders the module overview body: course breadcrumb, module title,
 * ordered list of lessons with durations, and lesson-level links to
 * the existing Lesson Page.
 */
export function ModuleOverview({
  course,
  module,
  lessons,
}: {
  course: Course;
  module: Module;
  lessons: ReadonlyArray<Lesson>;
}) {
  const t = useTranslations("CourseCatalog.moduleOverview");
  return (
    <article
      data-testid="module-overview"
      className="flex flex-col gap-8"
    >
      <nav
        aria-label={t("backToCourse")}
        className="text-sm"
      >
        <Link
          href={`/courses/${course.slug}` as never}
          className="text-practice-blue hover:underline focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
        >
          ← {course.title}
        </Link>
      </nav>
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
          {t("lessonCount", { count: lessons.length })}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{module.title}</h1>
      </header>
      <section
        aria-labelledby="module-lessons-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="module-lessons-heading"
          className="sr-only"
        >
          {t("lessonCount", { count: lessons.length })}
        </h2>
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson) => {
            const minutes = lessonDurationMinutes(lesson);
            return (
              <li
                key={lesson.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-col">
                  <span className="text-base font-medium">{lesson.title}</span>
                  {minutes !== null ? (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {t("duration", { minutes })}
                    </span>
                  ) : null}
                </div>
                <Link
                  href={lessonPath(course, module, lesson) as never}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-practice-blue px-5 text-sm font-semibold text-white hover:bg-practice-blue/90 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
                >
                  {t("openLesson")}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
