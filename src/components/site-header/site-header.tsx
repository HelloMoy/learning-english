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
import { useLearnerAchievements } from "@/hooks/use-learner-achievements/use-learner-achievements";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useThemeChoice } from "@/hooks/use-theme-choice/use-theme-choice";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { cn } from "@/lib/utils/utils";

import { useFormatter, useTranslations } from "next-intl";

/**
 * The Immersion Cinema top bar: the `ENGLISH·COURSE` wordmark, a section
 * eyebrow naming only the current section ("PROFILE") derived from the route,
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
  | "sectionAchievements"
  | "sectionProfile" {
  if (path.includes("/lessons/")) return "sectionLesson";
  if (path.includes("/modules/")) return "sectionModule";
  if (path.includes("/courses/")) return "sectionCourse";
  if (path === "/start" || path.startsWith("/start/")) return "sectionStart";
  if (path === "/learning") return "sectionLearning";
  if (path === "/achievements") return "sectionAchievements";
  if (path === "/profile") return "sectionProfile";
  return "sectionHome";
}

/**
 * @param levels - Every catalog course, for counting the prizes waiting to be
 *                 claimed; a route that cannot resolve the catalog marks nothing
 * @param signedIn - Whether the request carries a session, decided on the
 *                   server by the locale layout. Without one the header offers
 *                   Sign in instead of the learner's menu, and the wordmark
 *                   goes to the locale home rather than My learning.
 */
export function SiteHeader({
  levels = [],
  signedIn = false,
}: {
  levels?: ReadonlyArray<AchievementLevel>;
  signedIn?: boolean;
}) {
  const t = useTranslations("SiteHeader");
  const pathname = usePathname();
  const canInstall = useCanInstallToHomeScreen();
  const learner = useLearnerProfile();
  const section = t(sectionKey(pathname));
  const prizesReady = usePrizesReady(levels);
  // Until the card is known, a signed-in learner is laid out as if it will
  // arrive: most sessions have one, and guessing wrong costs one late toggle.
  const hasMenu = signedIn && learner.status !== "absent";

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
          <Brand href={signedIn ? "/learning" : "/"} />
          <span className="hidden text-[10px] tracking-[0.24em] text-muted-foreground uppercase sm:inline">
            {section}
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
            className={cn("inline-flex", hasMenu && "hidden sm:inline-flex")}
          >
            <ThemeToggle />
          </span>
          <SessionControl
            signedIn={signedIn}
            learner={learner}
            prizesReady={prizesReady}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * The header's account control: Sign in without a session; the learner's menu
 * with one, its place held while the card loads; and, for a learner signed in
 * before making their card, a plain Sign out, so no signed-in state is ever
 * without a way out.
 */
function SessionControl({
  signedIn,
  learner,
  prizesReady,
}: {
  signedIn: boolean;
  learner: ReturnType<typeof useLearnerProfile>;
  prizesReady: number;
}) {
  const t = useTranslations("SiteHeader");
  const signOut = useSignOut();

  if (!signedIn) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {t("signIn")}
      </Link>
    );
  }
  if (learner.status === "present") {
    return (
      <LearnerMenu
        profile={learner.profile}
        prizesReady={prizesReady}
        onSignOut={signOut}
      />
    );
  }
  if (learner.status === "unknown") {
    return (
      <span
        data-testid="learner-menu-placeholder"
        aria-hidden="true"
        className="inline-flex size-11 shrink-0"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {t("signOut")}
    </button>
  );
}

/**
 * Ends the session, then opens the home and refreshes the server tree so the
 * layout renders as signed out.
 */
function useSignOut(): () => Promise<void> {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  };
}

/**
 * How many prizes are waiting on the counter.
 *
 * @remarks
 * Counted here from the same derivation the Achievements page uses, rather than
 * from a stored tally, so "ready to claim" keeps one definition — including for
 * a learner who has never opened that page, who is exactly who the mark is for.
 */
function usePrizesReady(levels: ReadonlyArray<AchievementLevel>): number {
  const { courses } = useLearnerAchievements(levels);
  return courses
    .flatMap((course) => course.modules)
    .filter((achievements) => achievements.prizeState === "ready").length;
}

/**
 * The learner's avatar as a menu of their own pages. On a phone it also holds
 * the theme control, which the header row has no room for there.
 *
 * @remarks
 * A prize waiting to be claimed is marked on the avatar, which is what a learner
 * sees with the menu closed, and on the Achievements item, which is where the
 * mark is pointing. Both marks are decoration; the count reaches assistive
 * technology as a sentence on the menu's own name, so it is heard once.
 */
function LearnerMenu({
  profile,
  prizesReady,
  onSignOut,
}: {
  profile: LearnerProfile;
  prizesReady: number;
  onSignOut: () => Promise<void>;
}) {
  const t = useTranslations("SiteHeader");
  const { name, avatar } = profile;
  const hasPrizesReady = prizesReady > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          hasPrizesReady
            ? t("learnerMenuLabelWithPrizes", { name, count: prizesReady })
            : t("learnerMenuLabel", { name })
        }
        className="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <LearnerAvatar
          name={name}
          avatar={avatar}
          size="sm"
        />
        {hasPrizesReady ? (
          <PrizeMark
            count={prizesReady}
            testId="prize-mark"
            className="absolute -top-0.5 -right-0.5"
          />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/learning">{t("myLearning")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/achievements"
            className="justify-between gap-6"
          >
            {t("achievements")}
            {hasPrizesReady ? (
              <PrizeMark
                count={prizesReady}
                testId="prize-mark-item"
              />
            ) : null}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">{t("profile")}</Link>
        </DropdownMenuItem>
        <PhoneThemeItem />
        <DropdownMenuItem onSelect={() => void onSignOut()}>{t("signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * How many prizes are waiting, as a count on the avatar and on the menu item.
 *
 * @remarks
 * Deliberately not gold: gold is what a prize wears once it has been claimed,
 * and a mark in that colour would spend the moment the learner is being sent to
 * collect.
 */
function PrizeMark({
  count,
  testId,
  className,
}: {
  count: number;
  testId: string;
  className?: string;
}) {
  const format = useFormatter();

  return (
    <span
      data-testid={testId}
      aria-hidden="true"
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full border-2 border-background bg-foreground px-1 text-[0.6875rem] leading-4 font-bold text-background",
        className,
      )}
    >
      {format.number(count)}
    </span>
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
