"use client";

import { Button } from "@/components/ui/button/button";
import { useConsentQuestion } from "@/hooks/use-consent-question/use-consent-question";
import { Link } from "@/i18n/navigation";
import { denyConsent, grantConsent } from "@/lib/product-analytics/product-analytics";

import { useTranslations } from "next-intl";

const GUTTER = "px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6";

/**
 * The question a visitor is asked before any usage data is stored or sent:
 * may the site use cookies, link activity to their account and record their
 * session?
 *
 * @remarks
 * Renders only while the question is open — the visitor has not answered, or
 * asked to reconsider from the footer. It never appears when product analytics
 * was not started, so development, tests and CI show no banner.
 *
 * Declining and accepting are the same button, side by side: a choice that is
 * harder to refuse than to give is not a choice. Declining comes first in
 * reading and tab order.
 *
 * Not a dialog. It sits in a corner and takes no focus, so the page behind it
 * stays readable and usable while the question waits; only the card itself
 * catches the pointer.
 *
 * Being fixed, it would permanently cover whatever ends up beneath it on a
 * page no taller than the screen — a form's submit button, the footer's own
 * links. So a second, invisible and inert copy of the card is laid out in the
 * page's flow, reserving exactly the height the visible one covers: there is
 * always room to scroll the page clear of it. A copy rather than a measured
 * height, because it needs no script and is right at every width and locale.
 *
 * @example
 * ```tsx
 * <ConsentBanner />
 * ```
 *
 * @returns The banner, or `null` when there is nothing to ask
 *
 * @category Components
 */
export function ConsentBanner() {
  const t = useTranslations("Components.ConsentBanner");
  const question = useConsentQuestion();

  if (question !== "open") return null;

  return (
    <>
      <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex ${GUTTER}`}>
        <section
          aria-label={t("regionLabel")}
          className="pointer-events-auto flex w-full max-w-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
        >
          <ConsentCard />
        </section>
      </div>
      <div
        aria-hidden="true"
        inert
        className={`invisible flex ${GUTTER}`}
      >
        <ConsentCard />
      </div>
    </>
  );
}

function ConsentCard() {
  const t = useTranslations("Components.ConsentBanner");

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-[0_18px_44px_-24px_rgba(0,0,0,0.35)] backdrop-blur sm:p-5 dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9)]">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("body")}{" "}
        <Link
          href="/privacy"
          className="font-semibold text-foreground underline underline-offset-4"
        >
          {t("policyLink")}
        </Link>
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={denyConsent}
          className="min-h-11 text-[0.9375rem] font-bold text-foreground"
        >
          {t("decline")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={grantConsent}
          className="min-h-11 text-[0.9375rem] font-bold text-foreground"
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
