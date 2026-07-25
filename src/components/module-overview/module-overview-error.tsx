import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Inline error state for the Module Overview. Used for unknown module,
 * module-not-in-course and invalid params. The page never leaks the raw
 * domain error kind to the user.
 */
export function ModuleOverviewError({ courseSlug }: { courseSlug?: string }) {
  const t = useTranslations("CourseCatalog.moduleOverview");
  return (
    <section
      role="alert"
      className="mx-auto w-full max-w-3xl space-y-4 rounded border border-border bg-card p-6 px-4 py-12 text-center text-card-foreground"
    >
      <h1 className="text-xl font-semibold">{t("moduleNotInCourse")}</h1>
      <div className="flex flex-wrap justify-center gap-3">
        {courseSlug ? (
          <Link
            href={`/courses/${courseSlug}` as never}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-semibold hover:border-practice-blue/60 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
          >
            {t("backToCourse")}
          </Link>
        ) : null}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-practice-blue px-5 text-sm font-semibold text-white hover:bg-practice-blue/90 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
        >
          {t("goHome")}
        </Link>
      </div>
    </section>
  );
}
