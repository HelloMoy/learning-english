import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { LessonCompletionMark } from "@/components/lesson-completion-mark/lesson-completion-mark";
import { LessonWatchProgress } from "@/components/lesson-watch-progress/lesson-watch-progress";
import { PlayButton } from "@/components/play-button/play-button";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

const THUMB_GLOW =
  "radial-gradient(120% 120% at 30% 12%, color-mix(in oklab, var(--glow) 26%, var(--background)), var(--background) 72%)";

/**
 * Extends the row action's pointer target to the whole row without adding a
 * control: the box is the link's own `::after`, so the DOM, the accessibility
 * tree and the tab order are untouched. Anything that must stay clickable
 * through it needs `relative z-20`.
 */
const STRETCHED_HIT_AREA = "after:absolute after:inset-0 after:z-10 after:content-['']";

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
 * The module overview as a video list: a back link to the course, a title
 * header, and one row per lesson (thumbnail, "Video N" eyebrow,
 * title, duration, and a watch-video action linking to the Lesson Page).
 *
 * Rows used to be labelled "Episode N". That term denoted a Module on the
 * course overview and a Lesson here, so a learner who opened "episode 3"
 * landed on a list restarting at "Episode 1" — the same word pointing at two
 * levels of the hierarchy. See the `course-vocabulary` capability.
 *
 * @remarks
 * A row's central column carries the lesson's watch progress beneath its
 * title: the row's open middle is the only place a bar fits without crowding
 * the eyebrow, the duration or the row's action. Both that bar and the
 * completion mark are client islands — progress lives in `localStorage`,
 * which the server cannot read — so the rest of the list stays
 * server-rendered, and a lesson with nothing watched renders neither.
 *
 * A row's thumbnail shows the lesson's `poster` artwork, falling back to
 * the gradient tile and a decorative play circle when the lesson has none
 * — reading lessons never carry one. The gradient also sits behind the
 * image, so a slow or missing JPEG degrades to the placeholder instead of
 * a broken-image icon.
 *
 * The thumbnail links to the same lesson as the row's action, but
 * is deliberately pointer-only: `aria-hidden` plus `tabIndex={-1}` keep it
 * out of the accessibility tree and the tab order. It duplicates a
 * destination the row already exposes, so announcing it would read every
 * lesson twice and double the tab stops — 214 of them on the largest
 * module. If the row is ever restructured so the thumbnail becomes the
 * primary control, that treatment and the image's empty `alt` must both
 * flip to a real accessible name.
 *
 * ## Where a click lands
 *
 * The whole row is a pointer target for its lesson: the row reads as one
 * object, so a click on the title should do what a click on the action does.
 * That target is the action's own stretched `::after` — no wrapping link, no
 * extra control, no extra tab stop — and the row lights up on hover so the
 * area that responds to a click is the area that looks like it will.
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

      <header className="flex flex-col gap-6">
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
            const poster = lesson.kind === "video" ? lesson.poster : undefined;
            const durationSeconds = lesson.kind === "video" ? lesson.durationSeconds : 0;
            return (
              <li
                key={lesson.id}
                className="relative flex items-center gap-4 border-b border-border py-4 transition-colors first:border-t hover:bg-foreground/5"
              >
                <Link
                  href={lessonPath(course, module, lesson) as never}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="relative hidden h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border transition-colors hover:border-gold/50 sm:flex"
                  style={{ background: THUMB_GLOW }}
                >
                  {poster ? (
                    <Image
                      src={poster}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <PlayButton
                      size="sm"
                      decorative
                    />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Eyebrow>{t("videoOrdinal", { number: lesson.sequence })}</Eyebrow>
                  <span className="flex min-w-0 items-center gap-2">
                    {/* Truncation only from `sm` up. These titles share long
                        prefixes, so on a phone a single line cuts every row to
                        the same unusable stem — wrapping is what keeps the
                        list selectable. */}
                    <span className="text-base font-semibold text-foreground sm:truncate">
                      {lesson.title}
                    </span>
                    <LessonCompletionMark
                      lessonId={lesson.id}
                      durationSeconds={durationSeconds}
                    />
                  </span>
                  <LessonWatchProgress
                    lessonId={lesson.id}
                    durationSeconds={durationSeconds}
                  />
                </div>
                {minutes !== null ? (
                  <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
                    {t("duration", { minutes })}
                  </span>
                ) : null}
                <Link
                  href={lessonPath(course, module, lesson) as never}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-card-foreground transition-colors hover:border-gold/50 hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    STRETCHED_HIT_AREA,
                  )}
                >
                  <Play
                    className="size-3.5"
                    fill="currentColor"
                  />
                  {t("watchVideo")}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
