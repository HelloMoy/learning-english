"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

type Locale = (typeof routing.locales)[number];

/**
 * Map from each supported locale to the translation key used in the
 * menu option's label. Driven by `routing.locales` so adding a new locale
 * forces a TypeScript error here until the corresponding label key is added
 * to every locale's message file under `LocaleSwitcher.<key>`.
 */
const LOCALE_LABEL_KEY = {
  en: "english",
  es: "spanish",
  pt: "portuguese",
} as const satisfies Record<Locale, string>;

/**
 * Language selector that updates the active locale via `next-intl`'s
 * locale-aware navigation.
 *
 * Renders a compact trigger showing the active language — its ISO code on a
 * phone, its full localized name from `sm` up — which opens a menu of every
 * locale in `routing.locales`. Picking one navigates to the same path under
 * the new locale (`/en/about` → `/es/about`) using `router.replace` so the back
 * button still works. The transition is wrapped in `useTransition` so React can
 * keep the previous UI responsive while the navigation is in flight.
 *
 * @remarks
 * This was a native `<select>` until the mobile-viewport-fit change. A
 * `<select>` renders the text of its selected `<option>`, so its width is set
 * by the longest language name in the active locale — 106px, which does not fit
 * the header's width budget at 320px and cannot be swapped for a short code
 * with CSS. A button's width follows the text it actually renders, so the
 * `sm:hidden` / `hidden sm:inline` pair below is enough.
 *
 * The short codes come from `routing.locales` rather than from the message
 * files: `EN`/`ES`/`PT` are ISO 639-1 codes, identical in every locale, and
 * routing them through `next-intl` would invite three translations of a
 * constant to drift apart.
 *
 * The accessible name is built from the **full** localized language name, so a
 * screen reader announces "Language: English" at every width rather than
 * spelling out "E N" from the visible short code.
 *
 * Uses `@/i18n/navigation` (not `next/navigation`) so the locale prefix
 * is preserved automatically. The active locale comes from
 * `useLocale()` — never read it from the URL directly.
 */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleValueChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale as Locale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        aria-label={`${t("label")}: ${t(LOCALE_LABEL_KEY[currentLocale])}`}
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-foreground/5 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
      >
        <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
        <span className="hidden sm:inline">{t(LOCALE_LABEL_KEY[currentLocale])}</span>
        <ChevronDown
          className="size-3.5 opacity-70"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={handleValueChange}
        >
          {routing.locales.map((locale) => (
            <DropdownMenuRadioItem
              key={locale}
              value={locale}
            >
              <span className="inline-flex w-4 justify-center">
                <DropdownMenuItemIndicator>
                  <Check className="size-3.5" />
                </DropdownMenuItemIndicator>
              </span>
              {t(LOCALE_LABEL_KEY[locale])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
