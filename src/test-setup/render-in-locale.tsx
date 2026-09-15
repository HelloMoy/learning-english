import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import en from "../messages/en.json";
import es from "../messages/es.json";
import pt from "../messages/pt.json";

/** The shipped catalogues, keyed by locale. */
export const MESSAGES = { en, es, pt } as const;

/** A locale the app ships messages for. */
export type TestLocale = keyof typeof MESSAGES;

/**
 * Renders a component inside `NextIntlClientProvider` with the real message
 * catalogue for a locale, so a test asserts the copy a learner reads rather
 * than an echoed key.
 *
 * The provider is passed as Testing Library's `wrapper`, so `rerender` keeps it.
 *
 * @param ui - The element to render
 * @param locale - Which catalogue to provide; defaults to `en`
 * @returns The Testing Library render result
 */
export function renderInLocale(ui: ReactElement, locale: TestLocale = "en") {
  const LocaleProvider = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
    >
      {children}
    </NextIntlClientProvider>
  );
  return render(ui, { wrapper: LocaleProvider });
}
