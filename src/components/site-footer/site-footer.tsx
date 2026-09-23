import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The site's footer: the two legal documents, and nothing else.
 *
 * @remarks
 * Mounted once in the locale layout, outside `main`, so it is the page's
 * `contentinfo` landmark rather than part of the content a screen-reader user
 * is reading. It stays deliberately bare — it exists so the privacy policy and
 * the terms are reachable from every page, not as a second navigation.
 *
 * The links come from `@/i18n/navigation`, never `next/link`: those wrappers
 * are what keep the active locale in the URL, and ESLint cannot catch the
 * difference.
 *
 * @returns The footer landmark
 *
 * @category Layout
 */
export function SiteFooter() {
  const t = useTranslations("Components.SiteFooter");

  return (
    <footer className="border-t border-border">
      <nav
        aria-label={t("navLabel")}
        className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground sm:px-11"
      >
        <Link
          href="/privacy"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("privacy")}
        </Link>
        <Link
          href="/terms"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("terms")}
        </Link>
      </nav>
    </footer>
  );
}
