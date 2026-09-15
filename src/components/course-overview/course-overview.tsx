import { CourseCarousel } from "@/components/course-carousel/course-carousel";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The course overview: a compact "now showing" hero with Start course, then the
 * course's modules as a poster carousel with a progress panel beneath it.
 *
 * @remarks
 * The hero states what the course holds — lessons in the eyebrow, videos and
 * total runtime in the meta line — and carries the one Start course action,
 * which opens the deterministic first lesson.
 *
 * Everything that depends on the learner's progress lives in
 * {@link CourseCarousel}, a client island; the hero renders on the server.
 */
export function CourseOverview({
  course,
  modules,
  moduleSummaries,
  firstLesson,
}: {
  course: Course;
  modules: ReadonlyArray<Module>;
  moduleSummaries: ReadonlyArray<ModuleSummary>;
  firstLesson: Lesson | null;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();
  const totalDurationSeconds = moduleSummaries.reduce(
    (total, summary) => total + summary.totalDurationSeconds,
    0,
  );
  const startHref = firstLessonHref(course, modules, firstLesson);

  return (
    <article
      data-testid="course-overview"
      className="flex flex-col gap-4 pb-16 sm:gap-6 sm:pb-24"
    >
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-8 sm:px-11 sm:pt-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <Eyebrow>{t("nowShowing", { count: course.moduleCount })}</Eyebrow>
          <h1 className="font-sans text-[2.75rem] leading-none font-black tracking-[-0.04em] text-balance text-foreground sm:text-6xl">
            {course.title}
          </h1>
          <p
            data-testid="course-hero-meta"
            className="text-sm text-muted-foreground tabular-nums"
          >
            {t("courseMetaShort", {
              videos: t("lessonCount", { count: course.lessonCount }),
              duration: runtimeLabel(totalDurationSeconds),
            })}
          </p>
        </div>
        {startHref ? (
          <Link
            href={startHref as never}
            data-testid="start-course"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-[0.9375rem] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Play
              aria-hidden="true"
              className="size-4"
              fill="currentColor"
            />
            {t("startCourse")}
          </Link>
        ) : null}
      </header>

      <CourseCarousel
        course={course}
        modules={modules}
        moduleSummaries={moduleSummaries}
      />
    </article>
  );
}

function firstLessonHref(
  course: Course,
  modules: ReadonlyArray<Module>,
  firstLesson: Lesson | null,
): string | null {
  if (!firstLesson) return null;
  const firstModule = modules.find((module) => module.id === firstLesson.moduleId) ?? modules[0];
  return firstModule ? lessonPath(course, firstModule, firstLesson) : null;
}
