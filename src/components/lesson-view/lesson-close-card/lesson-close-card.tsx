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
 * Finishing a lesson and starting the next one are one moment for the learner,
 * so they share one surface: the card sits at the end of the center column,
 * right after the lesson's own content, and offers the next lesson as a
 * control-sized target instead of a line of text in the rail.
 *
 * The card is the page's only next-lesson affordance and renders the same at
 * every width. It began as a phone-only block — the desktop collapsed it to a
 * bare button and pointed at a rail card instead — until the learner asked for
 * the same closing surface everywhere; the rail card went with the collapse,
 * so the next lesson is still offered exactly once.
 *
 * Up next is a different question from "continue": it is simply the lesson
 * after this one in the course, whatever the learner has watched. Where to
 * continue — which may skip finished videos — is answered only by
 * `findContinueTarget`, used by the course overview, the module overview and
 * My learning.
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
      className="rounded-xl border border-border bg-card"
    >
      <div className="p-4">{children}</div>
      <div className="border-t border-border">
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
