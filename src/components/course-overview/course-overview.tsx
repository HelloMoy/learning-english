import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { GoldBadge } from "@/components/gold-badge/gold-badge";
import { PosterCard } from "@/components/poster-card/poster-card";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { lessonPath, moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The course overview as an Immersion Cinema "limited series": an eyebrow,
 * the course title with count pills, a season heading, and a poster grid of
 * modules (one PosterCard per module → its module overview). The former
 * interactive practice track is retired in favour of this grid (design.md
 * §D5). A "Start course" CTA links to the deterministic first lesson.
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
      className="flex flex-col gap-10"
    >
      <header className="flex flex-col gap-4">
        <Eyebrow>{t("limitedSeries")}</Eyebrow>
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

      <section
        aria-label={t("episodesGridLabel")}
        className="flex flex-col gap-5"
      >
        <Eyebrow as="h2">{t("season", { count: course.moduleCount })}</Eyebrow>
        <ul
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          data-testid="course-episode-grid"
        >
          {modules.map((module) => (
            <li key={module.id}>
              <PosterCard
                title={module.title}
                number={String(module.sequence).padStart(2, "0")}
                href={moduleOverviewPath(course, module)}
                badge={<GoldBadge variant="neutral">{t("moduleLabel")}</GoldBadge>}
              />
            </li>
          ))}
        </ul>
      </section>

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
