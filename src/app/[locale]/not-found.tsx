import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The not-found page for everything under the `[locale]` segment.
 *
 * @remarks
 * It says the **page** is missing, never that the learner's language is
 * unsupported — and that distinction is the reason this file changed.
 *
 * The proxy normalizes any first segment that is not a configured locale into
 * a path under the default locale: `/xx` is answered with a 307 to `/en/xx`,
 * `/de/courses` with a 307 to `/en/de/courses`. So a request never arrives
 * here carrying an unsupported locale. Every request that reaches this page
 * has a supported locale and a path that matches no route, which is why the
 * page's earlier "Locale not supported" copy was wrong in every case it was
 * ever shown — including `/es/error`, where it told a Spanish reader that
 * Spanish was unavailable.
 *
 * A path that bypasses the proxy — `/manifest.json`, excluded from its matcher
 * along with every other dotted path — is turned away by
 * `requireSupportedLocale` before any locale context exists, and resolves to
 * the framework's own not-found page above this boundary. There is no locale
 * to localize a message into there, and the requester is a machine.
 *
 * The home link goes through `@/i18n/navigation`, so it keeps the active
 * locale: the request already told us the learner's language, and discarding
 * it would be a second small failure on top of the first.
 *
 * Spec: lesson-view-polish § "An unknown path under a supported locale renders
 * a localized Page Not Found".
 */
export default function PageNotFound() {
  const t = useTranslations("PageNotFound");
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
