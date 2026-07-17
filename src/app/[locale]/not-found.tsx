import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Locale-segment not-found page. Reached when the middleware accepts a
 * locale that does not exist in the project's `routing.locales` (e.g.
 * `/xx`). Renders a localized message + a link back to the default
 * locale's home.
 *
 * Spec: lesson-view-polish § Requirement: "The Locale Not Found page is
 * localized".
 */
export default function LocaleNotFound() {
  const t = useTranslations("LocaleNotFound");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <section
        role="alert"
        className="space-y-4 rounded border border-slate-200 p-6 text-center dark:border-slate-700"
      >
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t("heading")}</h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">{t("description")}</p>
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
