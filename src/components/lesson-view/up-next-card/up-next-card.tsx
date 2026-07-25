import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The "Up next" card on the Lesson Page's right rail. When there is a next
 * lesson, it links to it (locale-aware) using that lesson's own module
 * slug — the next lesson may live in a different module than the current
 * one (see design.md §D4 — findNextLessonToRecommend crosses module
 * boundaries). When the learner is on the last lesson, it shows a terminal
 * "course completed" message.
 */
export function UpNextCard({
  course,
  nextLesson,
  nextLessonModule,
}: {
  course: Course;
  nextLesson: Lesson | null;
  nextLessonModule: Module | null;
}) {
  const t = useTranslations("Components.UpNextCard");
  return (
    <section
      aria-label={t("title")}
      className="rounded border border-slate-200 p-4 dark:border-slate-700"
    >
      <h2 className="mb-2 text-sm font-semibold">{t("title")}</h2>
      {nextLesson && nextLessonModule ? (
        <Link
          href={`/courses/${course.slug}/modules/${nextLessonModule.slug}/lessons/${nextLesson.id}`}
          className="inline-flex min-h-9 items-center text-sm font-medium text-practice-blue underline underline-offset-2 hover:opacity-80 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
        >
          {nextLesson.title}
        </Link>
      ) : (
        <p
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {t("courseCompleted")}
        </p>
      )}
    </section>
  );
}
