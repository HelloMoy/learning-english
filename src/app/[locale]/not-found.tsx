import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

import { MissingPath } from "./missing-path";

// On a phone the two actions share the row; from `sm` up they hug their labels.
const ACTION =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] px-5 text-[0.9375rem] whitespace-nowrap focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-none";
const PRIMARY_ACTION = `${ACTION} bg-primary font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter] hover:brightness-105`;
const SECONDARY_ACTION = `${ACTION} border border-border bg-background/50 font-bold text-foreground transition-colors hover:bg-background/80`;

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
 * Both links go through `@/i18n/navigation`, so they keep the active locale:
 * the request already told us the learner's language, and discarding it would
 * be a second small failure on top of the first.
 *
 * The course lobby is offered to everyone, and the page reads no session to
 * decide it. A visitor without one is taken through sign-in and back, as on
 * every other personal route; looking the session up here would cost a second
 * auth and database read on every missing page, for a secondary link.
 *
 * The state sits on the header's content column rather than in a card, and
 * takes every colour from the theme tokens, so it follows the light and dark
 * variants like the pages around it.
 *
 * Spec: lesson-view-polish § "An unknown path under a supported locale renders
 * a localized Page Not Found", § "The Page Not Found state offers the course
 * lobby as a second way out" and § "The Page Not Found state wears the
 * Immersion Cinema theme".
 */
export default function PageNotFound() {
  const t = useTranslations("PageNotFound");
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-11 sm:py-20"
    >
      <section
        role="alert"
        className="flex flex-col gap-7"
      >
        <div className="flex flex-col gap-3.5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="font-sans text-[2rem] leading-[1.02] font-black tracking-[-0.035em] text-balance text-foreground sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="max-w-[34rem] text-muted-foreground">{t("description")}</p>
          <MissingPath />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={PRIMARY_ACTION}
          >
            {t("goHome")}
          </Link>
          <Link
            href="/courses"
            className={SECONDARY_ACTION}
          >
            {t("viewCourses")}
          </Link>
        </div>
      </section>
    </main>
  );
}
