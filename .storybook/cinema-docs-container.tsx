import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";

import { CinemaBackground } from "../src/components/cinema-background/cinema-background";
import { routing } from "../src/i18n/routing";
import { cinemaLightTheme, cinemaTheme } from "./cinema-theme";
import { MESSAGES_BY_LOCALE, type SupportedLocale } from "./i18n";
import { canvasThemes } from "./toolbar";

import "./docs/docs.css";

type Globals = Record<string, unknown>;
type DocsContext = DocsContainerProps["context"];

/**
 * Docs container that makes every docs page behave like a story: it sits on the
 * app's `CinemaBackground`, and it obeys the toolbar's theme and locale.
 *
 * @remarks
 * Decorators never run on an MDX page with no story, so `withThemeByClassName`
 * and `withNextIntl` cannot reach these pages. The container does their job:
 * it puts the page and `<html>` in `.dark` (or on the light tokens), hands
 * `DocsContainer` the matching cinema theme, and provides the locale's
 * messages. `docs.css` clears Storybook's opaque page fill so the backdrop
 * shows through.
 */
export function CinemaDocsContainer({
  children,
  context,
  ...docsContainerProps
}: React.PropsWithChildren<DocsContainerProps>) {
  const { isDark, locale } = useToolbarChoices(context);
  useRootThemeClass(isDark);

  return (
    <div className={isDark ? "dark cinema-docs-page" : "cinema-docs-page"}>
      <CinemaBackground />
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES_BY_LOCALE[locale]}
      >
        <DocsContainer
          {...docsContainerProps}
          context={context}
          theme={isDark ? cinemaTheme : cinemaLightTheme}
        >
          {children}
        </DocsContainer>
      </NextIntlClientProvider>
    </div>
  );
}

function useToolbarChoices(context: DocsContext) {
  const [globals, setGlobals] = useState(() => currentGlobals(context));

  useEffect(() => {
    const follow = (update: { globals: Globals }) => setGlobals(update.globals);
    context.channel.on(GLOBALS_UPDATED, follow);
    return () => context.channel.off(GLOBALS_UPDATED, follow);
  }, [context]);

  return {
    isDark: (globals.theme ?? canvasThemes.defaultTheme) !== "light",
    locale: supportedLocale(globals.locale),
  };
}

// `<html>` carries `.dark` from `preview-head.html` onward, and on a docs page
// no decorator is left to take it off, so the light tokens would never apply.
function useRootThemeClass(isDark: boolean) {
  useEffect(() => {
    document.documentElement.classList.toggle(canvasThemes.themes.dark, isDark);
  }, [isDark]);
}

// The story store is not on Storybook's typed docs context, so it is read
// defensively: without it the page keeps the toolbar defaults.
function currentGlobals(context: DocsContext): Globals {
  const { store } = context as { store?: { userGlobals?: { get?: () => Globals } } };
  return store?.userGlobals?.get?.() ?? {};
}

function supportedLocale(locale: unknown): SupportedLocale {
  return routing.locales.find((supported) => supported === locale) ?? routing.defaultLocale;
}
