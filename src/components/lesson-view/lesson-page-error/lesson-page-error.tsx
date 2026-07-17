import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Inline error state for the Lesson Page. Used when the resolved route
 * is well-formed but the domain can't satisfy it (course not found,
 * module not in course, lesson not in module, or invalid URL params).
 *
 * Spec: lesson-page § Requirement: "The page handles domain errors with
 * a user-facing error state."
 */
export type LessonPageErrorKind =
  "course-not-found" | "module-not-in-course" | "lesson-not-in-module" | "invalid-params";

const errorKey: Record<LessonPageErrorKind, string> = {
  "course-not-found": "errorCourseNotFound",
  "module-not-in-course": "errorModuleNotInCourse",
  "lesson-not-in-module": "errorLessonNotInModule",
  // `invalid-params` falls back to the lesson-not-in-module message —
  // both are "couldn't find what you asked for in this scope" and the
  // URL was malformed at the boundary before the use case could run.
  "invalid-params": "errorLessonNotInModule",
};

export function LessonPageError({ kind }: { kind: LessonPageErrorKind }) {
  const t = useTranslations("Components.LessonPage");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <section
        role="alert"
        className="space-y-4 rounded border border-slate-200 p-6 text-center dark:border-slate-700"
      >
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t(errorKey[kind])}
        </h1>
        <Link
          href="/"
          className="inline-block rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {t("goHome")}
        </Link>
      </section>
    </main>
  );
}
