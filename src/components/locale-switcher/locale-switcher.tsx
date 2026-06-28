"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * Map from each supported locale to the translation key used in the
 * `<option>` label. Driven by `routing.locales` so adding a new locale
 * forces a TypeScript error here until the corresponding label key is added
 * to every locale's message file under `LocaleSwitcher.<key>`.
 */
const LOCALE_LABEL_KEY = {
  en: "english",
  es: "spanish",
  pt: "portuguese",
} as const satisfies Record<(typeof routing.locales)[number], string>;

/**
 * Language selector that updates the active locale via `next-intl`'s
 * locale-aware navigation.
 *
 * Renders a native `<select>` populated with every locale defined in
 * `routing.locales`. When the user picks a different option, the router
 * navigates to the same path under the new locale (`/en/about` → `/es/about`)
 * using `router.replace` so the back button still works. The transition is
 * wrapped in `useTransition` so React can keep the previous UI responsive
 * while the navigation is in flight.
 *
 * Uses `@/i18n/navigation` (not `next/navigation`) so the locale prefix
 * is preserved automatically. The active locale comes from
 * `useLocale()` — never read it from the URL directly.
 */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as (typeof routing.locales)[number];

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("label")}:</span>
      <select
        value={currentLocale}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {routing.locales.map((locale) => (
          <option
            key={locale}
            value={locale}
          >
            {t(LOCALE_LABEL_KEY[locale])}
          </option>
        ))}
      </select>
    </label>
  );
}
