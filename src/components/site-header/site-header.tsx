"use client";

import { Brand } from "@/components/brand/brand";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle/theme-toggle";
import { usePathname } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The Immersion Cinema top bar: the `LEARN·ENGLISH` wordmark, a section
 * eyebrow ("IMMERSION CINEMA · <SECTION>") derived from the current route,
 * and the locale + theme chips. Client-side because the section label reads
 * the pathname; the locale/theme controls were already client components.
 */
export function sectionKey(
  path: string,
): "sectionHome" | "sectionCourse" | "sectionModule" | "sectionLesson" {
  if (path.includes("/lessons/")) return "sectionLesson";
  if (path.includes("/modules/")) return "sectionModule";
  if (path.includes("/courses/")) return "sectionCourse";
  return "sectionHome";
}

export function SiteHeader() {
  const t = useTranslations("SiteHeader");
  const pathname = usePathname();
  const section = t(sectionKey(pathname));

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-sm"
      aria-label={t("navLabel")}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-11">
        <div className="flex items-baseline gap-4">
          <Brand />
          <span className="hidden text-[10px] tracking-[0.24em] text-muted-foreground uppercase sm:inline">
            {t("tagline")} · {section}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
