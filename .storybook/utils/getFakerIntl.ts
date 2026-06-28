import { faker, fakerES, fakerPT_BR } from "@faker-js/faker";

/**
 * Locale codes supported by the faker helper.
 *
 * Keep in sync with `routing.locales` in `src/i18n/routing.ts`. The
 * exhaustive `Record` below fails TypeScript compilation if a locale is
 * added to one but not the other.
 */
type SupportedLocale = "en" | "es" | "pt";

/**
 * Map of locale → faker instance. Each instance produces data localized to
 * its language (Spanish faker generates Spanish names, Portuguese faker
 * generates Brazilian Portuguese names, etc.).
 */
const FAKER_BY_LOCALE: Record<SupportedLocale, typeof faker> = {
  en: faker,
  es: fakerES,
  pt: fakerPT_BR,
};

/**
 * Returns the faker instance for the given locale.
 *
 * Used in stories that need generated sample data (lists of fake users,
 * mock transactions, generated dates, etc.) when the exact values don't
 * matter. Always pass the locale from the Storybook toolbar
 * (`context.globals.locale`) — never default to the English instance when
 * the toolbar shows `es` or `pt`, or you'll get Spanish UI labels with
 * English fake names.
 *
 * @example
 * ```ts
 * import { getFakerIntl } from "../../.storybook/utils/getFakerIntl";
 *
 * function UserProfileStory(
 *   _: unknown,
 *   context: { globals: { locale: "en" | "es" | "pt" } },
 * ) {
 *   const fakerIntl = getFakerIntl(context.globals.locale);
 *   return (
 *     <UserProfile
 *       name={fakerIntl.person.fullName()}
 *       email={fakerIntl.internet.email()}
 *     />
 *   );
 * }
 * ```
 *
 * @param locale - The currently active locale (from `context.globals.locale`).
 * @returns The locale-specific faker instance.
 */
export function getFakerIntl(locale: SupportedLocale) {
  return FAKER_BY_LOCALE[locale];
}
