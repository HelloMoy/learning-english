import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { PlayButton } from "@/components/play-button/play-button";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

const THUMB_GLOW =
  "radial-gradient(120% 120% at 30% 12%, color-mix(in oklab, var(--glow) 26%, var(--background)), var(--background) 72%)";

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
 * The module overview as a cinema "episode list": a back link to the
 * course, a hero poster + title, and one row per lesson (thumbnail,
 * "Episode N" eyebrow, title, duration, and an "Open" action linking to
 * the Lesson Page).
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
  const posterHeadline = (module.title.split(" ")[0] ?? module.title).toUpperCase();
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
          href={courseOverviewPath(course) as never}
          className="text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          ← {course.title}
        </Link>
      </nav>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-border sm:w-72"
          style={{ background: THUMB_GLOW }}
          aria-hidden="true"
        >
          <span
            className="absolute top-3 right-5 font-sans text-4xl font-extrabold text-gold tabular-nums"
            style={{ textShadow: "0 2px 24px color-mix(in oklab, var(--glow) 45%, transparent)" }}
          >
            {moduleNumber}
          </span>
          <span className="absolute bottom-5 left-5 font-sans text-2xl font-extrabold tracking-tight text-amber">
            {posterHeadline}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <Eyebrow>
            {t("lessonCount", { count: lessons.length })} ·{" "}
            {t("moduleLabel", { number: moduleNumber })}
          </Eyebrow>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {module.title}
          </h1>
        </div>
      </header>

      <section aria-labelledby="module-lessons-heading">
        <h2
          id="module-lessons-heading"
          className="sr-only"
        >
          {t("lessonCount", { count: lessons.length })}
        </h2>
        <ul className="flex flex-col">
          {lessons.map((lesson) => {
            const minutes = lessonDurationMinutes(lesson);
            return (
              <li
                key={lesson.id}
                className="flex items-center gap-4 border-b border-border py-4 first:border-t"
              >
                <div
                  className="relative hidden h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border sm:flex"
                  style={{ background: THUMB_GLOW }}
                  aria-hidden="true"
                >
                  <PlayButton
                    size="sm"
                    decorative
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Eyebrow>{t("episode", { number: lesson.sequence })}</Eyebrow>
                  <span className="truncate text-base font-semibold text-foreground">
                    {lesson.title}
                  </span>
                </div>
                {minutes !== null ? (
                  <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
                    {t("duration", { minutes })}
                  </span>
                ) : null}
                <Link
                  href={lessonPath(course, module, lesson) as never}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-card-foreground transition-colors hover:border-gold/50 hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Play
                    className="size-3.5"
                    fill="currentColor"
                  />
                  {t("open")}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
