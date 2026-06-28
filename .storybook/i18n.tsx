import type { Decorator } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { routing } from "../src/i18n/routing";
import enApp from "../src/messages/en.json";
import esApp from "../src/messages/es.json";
import ptApp from "../src/messages/pt.json";
import enStory from "./messages/en.json";
import esStory from "./messages/es.json";
import ptStory from "./messages/pt.json";

/**
 * All locales the Storybook preview supports.
 *
 * Keep in sync with `routing.locales` in `src/i18n/routing.ts` — the
 * exhaustive `Record` types below will fail TypeScript compilation if a
 * locale is added to one but not the others.
 */
export type SupportedLocale = (typeof routing.locales)[number];

/**
 * Merged messages per locale, combining:
 *
 *   - `src/messages/<locale>.json` — production UI strings that real
 *     components render (`HomePage.*`, `Components.ThemeToggle.*`, etc.).
 *     Stories that demonstrate real components need access to these so the
 *     rendered output matches what end users see.
 *
 *   - `.storybook/messages/<locale>.json` — demo copy that lives ONLY in
 *     stories under the `Stories.*` namespace ("Click me", "Delete", etc.).
 *     Never reaches the production bundle.
 *
 * The merge is safe: namespaces are disjoint (`Stories.*` vs `Components.*`
 * vs `HomePage.*`), so no key collision is possible. Story messages win
 * on conflict if a duplicate key ever sneaks in (e.g. accidentally
 * shadowing a real UI string with demo copy).
 */
export const MESSAGES_BY_LOCALE: Record<SupportedLocale, Record<string, unknown>> = {
  en: { ...enApp, ...enStory },
  es: { ...esApp, ...esStory },
  pt: { ...ptApp, ...ptStory },
} as Record<SupportedLocale, Record<string, unknown>>;

/**
 * Display labels for the locale toolbar dropdown.
 *
 * Adding a new locale requires:
 *   1. Add the code to `routing.locales` in `src/i18n/routing.ts`
 *   2. Create `src/messages/<locale>.json` (production strings)
 *   3. Create `.storybook/messages/<locale>.json` (story strings)
 *   4. Add an entry here — TypeScript will fail compilation if you forget
 *      (exhaustive `Record` key check)
 */
export const LOCALE_LABELS: Record<SupportedLocale, { flag: string; title: string }> = {
  en: { flag: "🇺🇸", title: "English" },
  es: { flag: "🇪🇸", title: "Español" },
  pt: { flag: "🇧🇷", title: "Português" },
};

/**
 * Decorator that wraps every story with `NextIntlClientProvider`.
 *
 * Locale resolution order (highest priority first):
 *   1. `parameters.locale` — explicit per-story override
 *   2. `globals.locale`    — selection from the toolbar dropdown
 *   3. `routing.defaultLocale` — fallback
 *
 * The toolbar (configured in `toolbar.ts`) is the recommended way to
 * preview a story in different locales — per-story `parameters` overrides
 * are for the rare case where a story must lock to a locale.
 */
export const withNextIntl: Decorator = (Story, context) => {
  const locale =
    (context.parameters.locale as SupportedLocale | undefined) ??
    (context.globals.locale as SupportedLocale | undefined) ??
    routing.defaultLocale;

  const messages = MESSAGES_BY_LOCALE[locale] ?? MESSAGES_BY_LOCALE[routing.defaultLocale];

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
    >
      <Story />
    </NextIntlClientProvider>
  );
};
