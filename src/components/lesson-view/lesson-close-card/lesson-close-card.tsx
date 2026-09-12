import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { ChevronRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The end-of-lesson block: the "Mark as complete" action and the next lesson
 * as one closing surface.
 *
 * @remarks
 * On a phone the Lesson Page's three columns stack, so the right rail — and
 * with it the "Up next" card — lands below everything else. This card pulls
 * that link up to where the learner already is when the lesson ends, and gives
 * it a control-sized tap target instead of a line of text.
 *
 * The closing chrome (the card surface, the prompt, the divider and the
 * next-lesson row) is phone-only: from `lg` up it collapses to a transparent
 * wrapper and the rail's `UpNextCard` is the page's next-lesson affordance
 * again, so the next lesson is never offered twice at the same width.
 *
 * The completion control arrives as `children` rather than being rendered
 * here, so this component stays presentational — it knows nothing of the
 * Server Action, the lesson id or the progress store, and nothing of whether
 * the lesson is complete. The control owns that state and the copy that
 * changes with it; the card owns the surface and the next lesson.
 *
 * @param course - The course the lesson belongs to, for the link's route
 * @param nextLesson - The lesson to continue with, or `null` on the last one
 * @param nextLessonModule - The next lesson's own module, which may differ from the current one
 * @param children - The "Mark as complete" action
 */
export function LessonCloseCard({
  course,
  nextLesson,
  nextLessonModule,
  children,
}: {
  course: Course;
  nextLesson: Lesson | null;
  nextLessonModule: Module | null;
  children: React.ReactNode;
}) {
  const t = useTranslations("Components.LessonCloseCard");
  return (
    <section
      data-testid="lesson-close-card"
      className="rounded-xl border border-border bg-card lg:rounded-none lg:border-0 lg:bg-transparent"
    >
      <div className="p-4 lg:p-0">{children}</div>
      <div className="border-t border-border lg:hidden">
        {nextLesson && nextLessonModule ? (
          <NextLessonRow
            course={course}
            lesson={nextLesson}
            module={nextLessonModule}
            eyebrow={t("upNext")}
          />
        ) : (
          <p
            className="p-4 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {t("courseCompleted")}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * The whole row is one link, so the learner taps anywhere on it and a screen
 * reader announces the destination once.
 */
function NextLessonRow({
  course,
  lesson,
  module,
  eyebrow,
}: {
  course: Course;
  lesson: Lesson;
  module: Module;
  eyebrow: string;
}) {
  return (
    <Link
      href={lessonPath(course, module, lesson)}
      className="flex min-h-11 items-center gap-3 rounded-b-xl bg-gold/5 p-4 transition-colors hover:bg-gold/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-gold/40 text-gold">
        <Play
          className="size-4 fill-current"
          aria-hidden="true"
        />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow as="span">{eyebrow}</Eyebrow>
        <span className="text-sm font-semibold text-pretty text-foreground">{lesson.title}</span>
      </span>
      <ChevronRight
        className="ml-auto size-5 shrink-0 text-gold"
        aria-hidden="true"
      />
    </Link>
  );
}
