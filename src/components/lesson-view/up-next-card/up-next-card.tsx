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
      className="rounded-xl border border-gold/40 bg-gold/5 p-4"
    >
      <h2 className="mb-2 text-xs font-bold tracking-[0.24em] text-gold uppercase">{t("title")}</h2>
      {nextLesson && nextLessonModule ? (
        <Link
          href={`/courses/${course.slug}/modules/${nextLessonModule.slug}/lessons/${nextLesson.id}`}
          className="inline-flex min-h-9 items-center text-sm font-semibold text-foreground hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
