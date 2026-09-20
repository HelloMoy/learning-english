import { getPathname } from "@/i18n/navigation";

import { vi } from "vitest";

/**
 * Makes the globally mocked `getPathname` prefix the locale, as next-intl's
 * real one does with `localePrefix: "always"`. Call it in `beforeEach` of a
 * test that asserts on localized URLs.
 */
export function localizeGetPathname(): void {
  vi.mocked(getPathname).mockImplementation(
    ({ href, locale }) => `/${locale}${typeof href === "string" ? href : href.pathname}`,
  );
}
