"use client";

import { Brand } from "@/components/brand/brand";
import { InstallAppButton } from "@/components/install-app-button/install-app-button";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle/theme-toggle";
import { useCanInstallToHomeScreen } from "@/hooks/use-can-install-to-home-screen/use-can-install-to-home-screen";
import { usePathname } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * The Immersion Cinema top bar: the `ENGLISH·COURSE` wordmark, a section
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
  const canInstall = useCanInstallToHomeScreen();
  const section = t(sectionKey(pathname));

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-sm"
      aria-label={t("navLabel")}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-11">
        {/* `min-w-0` is what lets flex-shrink engage at all: a flex item's
            default `min-width: auto` floors it at its intrinsic content width,
            and the wordmark has no spaces to wrap at. Without it the row's
            minimum was 512px and the whole document scrolled sideways on every
            phone. `overflow-hidden` bounds the worst case to a clipped
            wordmark rather than a sideways-scrolling page. */}
        <div className="flex min-w-0 shrink items-baseline gap-4 overflow-hidden">
          <Brand />
          <span className="hidden text-[10px] tracking-[0.24em] text-muted-foreground uppercase sm:inline">
            {t("tagline")} · {section}
          </span>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          {/* Only ever present on iPhone Safari, and only before the app has been
              installed, so it is decided after hydration and appears a moment
              after load — which does nudge the chips after it one step right. */}
          {canInstall ? <InstallAppButton /> : null}
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
