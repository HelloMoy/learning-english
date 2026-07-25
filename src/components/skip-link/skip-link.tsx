"use client";

import { useTranslations } from "next-intl";

/**
 * The first focusable element on every page. Hidden until it receives
 * keyboard focus, then becomes visible to offer screen-reader and
 * keyboard users a way to jump to the page's main landmark.
 */
export function SkipLink() {
  const t = useTranslations("Layout");
  return (
    <a
      href="#main"
      className="sr-only bg-card text-card-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
    >
      {t("skipToContent")}
    </a>
  );
}
