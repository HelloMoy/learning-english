import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Inline error state for the Lesson Page. Used when the resolved route
 * is well-formed but the domain can't satisfy it (module not in course,
 * lesson not in module). For `course-not-found` the page routes through
 * `next/navigation`'s `notFound()` instead, so this component is not
 * rendered in that case.
 *
 * Spec: lesson-page § Requirement: "The page handles domain errors with
 * a user-facing error state."
 */
export type LessonPageErrorKind =
  "module-not-in-course" | "lesson-not-in-module" | "invalid-params";

const errorKey: Record<LessonPageErrorKind, string> = {
  "module-not-in-course": "errorModuleNotInCourse",
  "lesson-not-in-module": "errorLessonNotInModule",
  "invalid-params": "errorLessonNotInModule",
};

export function LessonPageError({ kind }: { kind: LessonPageErrorKind }) {
  const t = useTranslations("Components.LessonPage");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <section
        role="alert"
        className="space-y-4 rounded border border-slate-200 p-6 text-center dark:border-slate-700"
      >
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t(errorKey[kind])}
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
