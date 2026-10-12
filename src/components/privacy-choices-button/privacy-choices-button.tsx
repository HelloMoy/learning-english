"use client";

import { useConsentQuestion } from "@/hooks/use-consent-question/use-consent-question";
import { reconsiderConsent } from "@/lib/product-analytics/product-analytics";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";

/**
 * The footer control that reopens the consent question, so an answer given
 * once can be changed as easily as it was given.
 *
 * @remarks
 * Renders nothing when product analytics was not started: with no choice to
 * make, a control offering one would be a dead end.
 *
 * A `button`, not a link — it changes what is on screen and goes nowhere.
 *
 * @example
 * ```tsx
 * <PrivacyChoicesButton className="hover:underline" />
 * ```
 *
 * @param className - Extra classes, so it can match the links it sits beside
 * @returns The control, or `null` when there is no choice to reopen
 *
 * @category Components
 */
export function PrivacyChoicesButton({ className }: { className?: string }) {
  const t = useTranslations("Components.PrivacyChoicesButton");
  const question = useConsentQuestion();

  if (question === "unavailable") return null;

  return (
    <button
      type="button"
      onClick={reconsiderConsent}
      className={cn("cursor-pointer", className)}
    >
      {t("label")}
    </button>
  );
}
