import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Inline error state for the Course Overview. Reused for the unknown
 * `courseSlug` and the `internal-error` case. The page never leaks the
 * raw error kind to the user.
 */
export function CourseOverviewError() {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <section
      role="alert"
      className="mx-auto w-full max-w-3xl space-y-4 rounded border border-border bg-card p-6 px-4 py-12 text-center text-card-foreground"
    >
      <h1 className="text-xl font-semibold">{t("courseNotFound")}</h1>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-practice-blue px-6 text-sm font-semibold text-white hover:bg-practice-blue/90 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
      >
        {t("goHome")}
      </Link>
    </section>
  );
}
