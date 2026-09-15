"use client";

import { Brand } from "@/components/brand/brand";
import { InstallAppButton } from "@/components/install-app-button/install-app-button";
import { LearnerAvatar } from "@/components/learner-avatar/learner-avatar";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";
import { ThemeSwitchTrack } from "@/components/theme-switch-track/theme-switch-track";
import { ThemeToggle } from "@/components/theme-toggle/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useCanInstallToHomeScreen } from "@/hooks/use-can-install-to-home-screen/use-can-install-to-home-screen";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useThemeChoice } from "@/hooks/use-theme-choice/use-theme-choice";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";

/**
 * The Immersion Cinema top bar: the `ENGLISH·COURSE` wordmark, a section
 * eyebrow ("IMMERSION CINEMA · <SECTION>") derived from the current route,
 * and the locale + theme chips. Client-side because the section label reads
 * the pathname; the locale/theme controls were already client components.
 */
export function sectionKey(
  path: string,
):
  | "sectionHome"
  | "sectionCourse"
  | "sectionModule"
  | "sectionLesson"
  | "sectionStart"
  | "sectionLearning"
  | "sectionProfile" {
  if (path.includes("/lessons/")) return "sectionLesson";
  if (path.includes("/modules/")) return "sectionModule";
  if (path.includes("/courses/")) return "sectionCourse";
  if (path === "/start" || path.startsWith("/start/")) return "sectionStart";
  if (path === "/learning") return "sectionLearning";
  if (path === "/profile") return "sectionProfile";
  return "sectionHome";
}

export function SiteHeader() {
  const t = useTranslations("SiteHeader");
  const pathname = usePathname();
  const canInstall = useCanInstallToHomeScreen();
  const learner = useLearnerProfile();
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
          {/* A phone cannot fit the wordmark and three 44px controls, so with a
              profile the theme control moves into the avatar menu below `sm`. */}
          <span
            data-testid="header-theme-toggle"
            className={cn("inline-flex", learner.status === "present" && "hidden sm:inline-flex")}
          >
            <ThemeToggle />
          </span>
          {learner.status === "present" ? <LearnerMenu profile={learner.profile} /> : null}
        </div>
      </div>
    </header>
  );
}

/**
 * The learner's avatar as a menu of their own pages. On a phone it also holds
 * the theme control, which the header row has no room for there.
 */
function LearnerMenu({ profile }: { profile: LearnerProfile }) {
  const t = useTranslations("SiteHeader");
  const { name, avatar } = profile;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("learnerMenuLabel", { name })}
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <LearnerAvatar
          name={name}
          avatar={avatar}
          size="sm"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/learning">{t("myLearning")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">{t("profile")}</Link>
        </DropdownMenuItem>
        <PhoneThemeItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The theme switch as a menu item, shown only below `sm`.
 *
 * Choosing it does not close the menu: the learner is looking at the switch,
 * and closing on select would hide the slide they just asked for. Both theme
 * names share one grid cell with the inactive one invisible, so the item keeps
 * the width of the longer name and the open menu never resizes as it toggles.
 */
function PhoneThemeItem() {
  const t = useTranslations("ThemeToggle");
  const choice = useThemeChoice();
  if (!choice) return null;

  const isDark = choice.currentTheme === "dark";
  const handleSelect = (event: Event) => {
    event.preventDefault();
    choice.toggle();
  };

  return (
    <DropdownMenuItem
      onSelect={handleSelect}
      aria-label={`${t("label")}: ${t(choice.currentTheme)}`}
      className="justify-between gap-6 sm:hidden"
    >
      <span
        aria-hidden="true"
        className="grid grid-cols-1 grid-rows-1"
      >
        <span className={cn("col-start-1 row-start-1", !isDark && "invisible")}>{t("dark")}</span>
        <span className={cn("col-start-1 row-start-1", isDark && "invisible")}>{t("light")}</span>
      </span>
      <ThemeSwitchTrack isDark={isDark} />
    </DropdownMenuItem>
  );
}
