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

/** Initial values for the toolbar globals. */
export const initialGlobals: NonNullable<Preview["initialGlobals"]> = {
  locale: routing.defaultLocale,
};
