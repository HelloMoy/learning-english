import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

import { CourseOverviewTrack } from "./course-overview-track";

/**
 * The course overview body. Renders the course title, totals, the
 * interactive practice-track navigation, and a Start course CTA to the
 * deterministic first lesson. The track IS the module list — keeping
 * both would duplicate the navigation, so the separate "10 modules"
 * list has been removed in favour of the 10-step track.
 */
export function CourseOverview({
  course,
  modules,
  firstLesson,
}: {
  course: Course;
  modules: ReadonlyArray<Module>;
  firstLesson: Lesson | null;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const firstModule = firstLesson
    ? (modules.find((module) => module.id === firstLesson.moduleId) ?? modules[0])
    : null;
  return (
    <article
      data-testid="course-overview"
      className="flex flex-col gap-8"
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{course.title}</h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {course.description}
        </p>
      </header>
      <CourseOverviewTrack
        course={course}
        modules={modules}
      />
      {firstLesson && firstModule ? (
        <div className="flex justify-end">
          <Link
            href={lessonPath(course, firstModule, firstLesson) as never}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-signal-yellow px-6 text-sm font-semibold text-ink hover:bg-signal-yellow/90 focus-visible:ring-3 focus-visible:ring-signal-yellow/60 focus-visible:outline-ring"
            data-testid="start-course"
          >
            {t("startCourse")}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
