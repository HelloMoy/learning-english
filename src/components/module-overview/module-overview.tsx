import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { ModuleRoute } from "@/components/module-route/module-route";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { splitRuntime } from "@/lib/module-route/module-route";

import { useTranslations } from "next-intl";

/**
 * The module overview as a route through its videos: a server-rendered header
 * — back link, `Lesson NN · Course` eyebrow, title, and how many videos the
 * module holds with their total runtime — above the learner's route.
 *
 * @remarks
 * Everything here renders on the server except `ModuleRoute`. The route and its
 * progress panel depend on progress stored in the browser, so they are the one
 * client subtree; the header states only facts the server already knows.
 *
 * The header carries no decorative hero tile: a `Module` has no artwork, so a
 * tile could only repeat the ordinal and a truncation of the title.
 *
 * Steps were once labelled "Episode N", a term that meant a Module on the
 * course overview and a Lesson here. See the `course-vocabulary` capability.
 *
 * @param props.course - The course the module belongs to
 * @param props.module - The module being shown
 * @param props.lessons - The module's lessons, in sequence order
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
  const moduleNumber = String(module.sequence).padStart(2, "0");
  const runtime = t("runtime", splitRuntime(totalRuntimeSeconds(lessons)));

  return (
    <article
      data-testid="module-overview"
      className="flex flex-col gap-7 lg:gap-12"
    >
      <header className="flex flex-col gap-5 lg:gap-6">
        <nav
          aria-label={t("backToCourse")}
          className="text-sm"
        >
          <Link
            href={courseOverviewPath(course) as never}
            className="text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            ← {course.title}
          </Link>
        </nav>
        <div className="flex flex-col gap-3">
          <Eyebrow>
            {t("moduleEyebrow", { number: moduleNumber, courseTitle: course.title })}
          </Eyebrow>
          <h1 className="font-sans text-5xl font-extrabold tracking-tight text-foreground lg:text-7xl">
            {module.title}
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base">
            {t("stats", { count: lessons.length, runtime })}
          </p>
        </div>
      </header>

      <section aria-labelledby="module-lessons-heading">
        <h2
          id="module-lessons-heading"
          className="sr-only"
        >
          {t("lessonCount", { count: lessons.length })}
        </h2>
        <ModuleRoute
          course={course}
          module={module}
          lessons={lessons}
        />
      </section>
    </article>
  );
}

function totalRuntimeSeconds(lessons: ReadonlyArray<Lesson>): number {
  return lessons.reduce(
    (total, lesson) => total + (lesson.kind === "video" ? lesson.durationSeconds : 0),
    0,
  );
}
