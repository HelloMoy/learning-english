"use client";

import { Brand } from "@/components/brand/brand";
import { InstallAppButton } from "@/components/install-app-button/install-app-button";
import { LearnerAvatar } from "@/components/learner-avatar/learner-avatar";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";
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
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { cn } from "@/lib/utils/utils";

import { CircleUser } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * The Immersion Cinema top bar: the `ENGLISH·COURSE` wordmark, a section
 * eyebrow ("IMMERSION CINEMA · <SECTION>") derived from the current route,
 * and the locale chip. The theme is not set here — its only control lives in
 * the Profile page's Preferences section. Client-side because the section
 * label reads the pathname; the locale control was already a client component.
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

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-sm"
      aria-label={t("navLabel")}
    >
      {/* The gaps are minimums under `justify-between`: they only bind once the
          row runs out of width, which is exactly when the wordmark would start
          losing letters, so they step down on a phone and nowhere else. */}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-1 px-4 py-4 sm:gap-4 sm:px-11">
        {/* `min-w-0` is what lets flex-shrink engage at all: a flex item's
            default `min-width: auto` floors it at its intrinsic content width,
            and the wordmark has no spaces to wrap at. Without it the row's
            minimum was 512px and the whole document scrolled sideways on every
            phone. `overflow-hidden` bounds the worst case to a clipped
            wordmark rather than a sideways-scrolling page. */}
        <div className="flex min-w-0 shrink items-baseline gap-4 overflow-hidden">
          <Brand href={signedIn ? "/learning" : "/"} />
          <span className="hidden text-[10px] tracking-[0.24em] text-muted-foreground uppercase sm:inline">
            {t("tagline")} · {section}
          </span>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          {/* Only ever present on iPhone Safari, and only before the app has been
              installed, so it is decided after hydration and appears a moment
              after load — which does nudge the chips after it one step right. */}
          {canInstall ? <InstallAppButton /> : null}
          <LocaleSwitcher />
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
 * The account control's spelled-out half, worn by both the Sign in link and the
 * Sign out button. Hidden below `sm`, where {@link AccountMenu} takes over.
 */
const ACCOUNT_LABEL_CLASSES =
  "hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:inline-flex";

/**
 * The header's account control: Sign in without a session; the learner's menu
 * with one, its place held while the card loads; and, for a learner signed in
 * before making their card, a plain Sign out, so no signed-in state is ever
 * without a way out.
 *
 * @remarks
 * The first and last of those are a word, and on a phone the row has no width
 * for one — the wordmark loses letters to pay for it. So each renders twice:
 * spelled out from `sm` up, and below that folded into {@link AccountMenu}.
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
      <>
        <Link
          href="/sign-in"
          className={ACCOUNT_LABEL_CLASSES}
        >
          {t("signIn")}
        </Link>
        <AccountMenu>
          <DropdownMenuItem asChild>
            <Link href="/sign-in">{t("signIn")}</Link>
          </DropdownMenuItem>
        </AccountMenu>
      </>
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
    <>
      <button
        type="button"
        onClick={signOut}
        className={cn(ACCOUNT_LABEL_CLASSES, "cursor-pointer")}
      >
        {t("signOut")}
      </button>
      <AccountMenu>
        <DropdownMenuItem onSelect={() => void signOut()}>{t("signOut")}</DropdownMenuItem>
      </AccountMenu>
    </>
  );
}

/**
 * The account action on a phone: the round trigger the learner's avatar already
 * occupies in this corner, wearing the generic account mark because there is no
 * card to draw, and holding the action itself as a menu item.
 *
 * @remarks
 * The trigger names itself as the menu rather than as the action inside it — a
 * button called "Sign in" that opens a menu instead of signing in would
 * misdescribe itself. The action keeps its own name on the item, where it is
 * also the visible text.
 *
 * It wears the chip its neighbours wear rather than the avatar's round frame:
 * the avatar is round because it is a portrait, and this holds a glyph, in a
 * row of glyph chips. `px-3` around a 16px glyph comes to 40px, which
 * `min-w-11` floors to the same 44px the row's widths were measured against.
 *
 * @param children - The menu's items: one account action
 */
function AccountMenu({ children }: { children: ReactNode }) {
  const t = useTranslations("SiteHeader");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("accountMenuLabel")}
        className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-foreground/5 px-3 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:hidden"
      >
        <CircleUser
          aria-hidden="true"
          className="size-4"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
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
 * The learner's avatar as a menu of their own pages.
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
