import { PracticeTrackSummary } from "@/components/practice-track/practice-track";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Renders the lesson's poster as artwork when available, otherwise falls back
 * to the practice-track typography. Keeps the card accessible whether the
 * underlying seed includes a poster URL or not.
 */
function pickPosterUrl(lesson: Lesson | null): string | null {
  if (!lesson || lesson.kind !== "video") return null;
  return lesson.poster ?? null;
}

/**
 * One course row on the locale home. The card keeps a single bold motif
 * (the practice track) and a single loud element (the open-course link).
 * The poster stays small; counts live inside the track as a leading
 * label so the card doesn't repeat the same data in three places.
 */
export function CourseCard({
  course,
  firstLesson,
  trackLabel,
}: {
  course: Course;
  firstLesson: Lesson | null;
  trackLabel: string;
}) {
  const t = useTranslations("CourseCatalog.card");
  const posterUrl = pickPosterUrl(firstLesson);
  return (
    <article
      data-testid="course-card"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-7"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-studio-paper sm:h-24 sm:w-24">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={t("posterAlt", { title: course.title })}
              width={96}
              height={96}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-[10px] font-semibold tracking-wider text-ink/70 uppercase">
              {course.title}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">{course.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        </div>
      </div>
      <PracticeTrackSummary
        moduleCount={course.moduleCount}
        label={trackLabel}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("moduleCount", { count: course.moduleCount })}
          <span aria-hidden="true"> · </span>
          {t("lessonCount", { count: course.lessonCount })}
        </span>
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-signal-yellow px-5 text-sm font-semibold text-ink hover:bg-signal-yellow/90 focus-visible:ring-3 focus-visible:ring-signal-yellow/60 focus-visible:outline-ring"
          data-testid="course-card-link"
        >
          {t("open")}
        </Link>
      </div>
    </article>
  );
}
