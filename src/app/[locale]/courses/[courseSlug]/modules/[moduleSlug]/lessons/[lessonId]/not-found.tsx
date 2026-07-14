import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * 404 page for the Lesson Page route. Reached when `findLessonForView`
 * resolves with `course-not-found`. Renders the localized "course not
 * found" message with a locale-aware "Go home" link, matching the spec
 * scenario for an unknown course.
 *
 * Spec: lesson-page § Requirement: "The page handles domain errors with
 * a user-facing error state" → Scenario: "An unknown course renders an
 * error state".
 */
export default function LessonPageNotFound() {
  const t = useTranslations("Components.LessonPage");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <section
        role="alert"
        className="space-y-4 rounded border border-slate-200 p-6 text-center dark:border-slate-700"
      >
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t("errorCourseNotFound")}
        </h1>
        <Link
          href="/courses"
          className="inline-block rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {t("goHome")}
        </Link>
      </section>
    </main>
  );
}
