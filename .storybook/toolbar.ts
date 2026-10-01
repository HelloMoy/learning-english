import type { Preview } from "@storybook/nextjs-vite";

import { routing } from "../src/i18n/routing";
import { LOCALE_LABELS } from "./i18n";

/**
 * Toolbar configuration for the Storybook preview.
 *
 * Items are derived from `routing.locales` so adding a new locale to
 * `src/i18n/routing.ts` automatically extends the toolbar.
 */
export const globalTypes: NonNullable<Preview["globalTypes"]> = {
  locale: {
    description: "Internationalization locale",
    toolbar: {
      icon: "globe",
      items: routing.locales.map((locale) => ({
        value: locale,
        right: LOCALE_LABELS[locale].flag,
        title: LOCALE_LABELS[locale].title,
      })),
      dynamicTitle: true,
    },
  },
};

/**
 * The canvas themes the toolbar switches between, as `withThemeByClassName`
 * options: each maps to the class it puts on `<html>`, and `.dark` is what
 * re-declares the Immersion Cinema tokens. Dark is the default because it is
 * the app's default (see the `cinema-theme-tokens` spec).
 */
export const canvasThemes = {
  themes: { light: "", dark: "dark" },
  defaultTheme: "dark",
} as const;

/** Initial values for the toolbar globals. */
export const initialGlobals: NonNullable<Preview["initialGlobals"]> = {
  locale: routing.defaultLocale,
};
