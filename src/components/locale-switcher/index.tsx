"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABEL_KEY = {
  en: "english",
  es: "spanish",
  pt: "portuguese",
} as const;

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
