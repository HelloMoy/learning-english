import { GoldBadge } from "@/components/gold-badge/gold-badge";
import { ModuleShowcaseCard } from "@/components/module-showcase-card/module-showcase-card";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The course overview as a numbered index of modules.
 *
 * @remarks
 * This replaces a five-column grid of `PosterCard`s. That grid was the
 * defect: a poster with a 16:9 box, a play circle and an oversized number
 * reads as one video, and the "Season 1 · N episodes" heading above it said
 * the same thing in words. Learners took each card for an episode to play
 * rather than a group of lessons to open.
 *
 * Each module now gets a full-width `ModuleShowcaseCard` — one per row, in
 * sequence, with its ordinal outside the card so the page reads as a
 * numbered list. One column rather than two is a deliberate trade: the page
 * is roughly 2.7× taller than the grid it replaces, which is affordable at
 * ten modules and buys the horizontal room the mosaic needs to show lesson
 * titles without truncating them into indistinguishability.
 *
 * A "Start course" action still links to the deterministic first lesson.
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
  const summaryByModule = new Map(moduleSummaries.map((summary) => [summary.moduleId, summary]));
  const firstModule = firstLesson
    ? (modules.find((module) => module.id === firstLesson.moduleId) ?? modules[0])
    : null;

  return (
    <article
      data-testid="course-overview"
      className="flex flex-col gap-10"
    >
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {course.title}
          </h1>
          <div className="flex items-center gap-2 pt-2">
            <GoldBadge variant="neutral">
              {t("moduleCount", { count: course.moduleCount })}
            </GoldBadge>
            <GoldBadge variant="neutral">
              {t("lessonCount", { count: course.lessonCount })}
            </GoldBadge>
          </div>
        </div>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {course.description}
        </p>
      </header>

      <ul
        aria-label={t("moduleListLabel")}
        className="flex flex-col gap-10"
        data-testid="course-module-list"
      >
        {modules.map((module) => {
          const summary = summaryByModule.get(module.id);
          if (!summary) return null;
          return (
            <li key={module.id}>
              <ModuleShowcaseCard
                course={course}
                module={module}
                summary={summary}
              />
            </li>
          );
        })}
      </ul>

      {firstLesson && firstModule ? (
        <div className="flex justify-end">
          <Link
            href={lessonPath(course, firstModule, firstLesson) as never}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            data-testid="start-course"
          >
            <Play
              className="size-4"
              fill="currentColor"
            />
            {t("startCourse")}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
