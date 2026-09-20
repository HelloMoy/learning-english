import { MESSAGES, type TestLocale } from "@/test-setup/render-in-locale";

import { createTranslator } from "next-intl";

/**
 * Stand-in for `next-intl/server` in tests of Server Components, which run
 * outside a request. Translates with the real message catalogues, so
 * assertions read real copy. Use it as the whole module:
 *
 * ```ts
 * vi.mock("next-intl/server", () => import("@/test-setup/stubs/next-intl-server"));
 * ```
 */
export async function getTranslations({
  locale,
  namespace,
}: {
  locale: TestLocale;
  namespace?: string;
}) {
  // Loosened on purpose: the stub serves any namespace a page asks for.
  return createTranslator({
    locale,
    messages: MESSAGES[locale] as Record<string, unknown>,
    namespace,
  });
}

/** No request to scope in a test. */
export function setRequestLocale(): void {}
