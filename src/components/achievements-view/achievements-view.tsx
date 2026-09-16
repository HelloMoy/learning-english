"use client";

import type { ResolveContinueWatching } from "@/app/[locale]/resolve-continue-watching";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { HomeFirstLesson } from "@/components/home-view/home-view";
import { LearnerAchievements } from "@/components/learner-achievements/learner-achievements";
import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import { AchievementsGuideModal } from "@/components/modals/achievements-guide-modal/achievements-guide-modal";
import { PrizeRedeemedModal } from "@/components/modals/prize-redeemed-modal/prize-redeemed-modal";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useLearnerAchievements } from "@/hooks/use-learner-achievements/use-learner-achievements";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { claimPrize } from "@/hooks/use-prize-claims/use-prize-claims";
import {
  useResolvedContinueWatching,
  type ResolvedContinueWatching,
} from "@/hooks/use-resolved-continue-watching/use-resolved-continue-watching";
import { Link } from "@/i18n/navigation";
import type {
  AchievementLevel,
  CourseAchievements,
  ModuleAchievements,
} from "@/lib/learner-achievements/learner-achievements";

import NiceModal from "@ebay/nice-modal-react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useEffect, type CSSProperties } from "react";

/**
 * The Achievements page: the learner's card with the distinction they have
 * earned, and their tickets and prizes across the whole catalog.
 *
 * @remarks
 * The page belongs to a learner, so it waits for the profile: until storage
 * has answered it renders a shell that asserts no counts, and a device without
 * a card is sent to the onboarding. Achievements are derived from this device's
 * completion on every render; the one thing this page writes is a claim, when
 * the learner takes a prize whose tickets are all collected.
 *
 * Arriving from the lesson page's waiting-prize dialog, the URL names the module
 * the learner came for: that prize is brought into view, focused and pointed out
 * until they claim it.
 *
 * The page's one action explains how achievements are earned, in a dialog, so a
 * returning learner is not scrolling past the explanation on every visit.
 * Editing the card stays the Profile's job, reached from the avatar menu.
 *
 * The counter is not a dead end: the page closes with the way back into the
 * course, where the learner left off.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 * @param level - The level line the card shows
 * @param lessonRuntimes - The level's lessons, for the card's progress line
 * @param levels - Every catalog course, for the achievements
 * @param firstLesson - The lesson to offer a learner who has started nothing
 * @param continueWatching - Overrides the continue-watching adapter; tests inject a fake
 * @param resolve - Overrides the resolver; defaults to the Server Action
 */
export function AchievementsView({
  profiles,
  level,
  lessonRuntimes,
  levels,
  firstLesson,
  continueWatching,
  resolve,
}: {
  profiles?: LearnerProfileRepository;
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  levels: ReadonlyArray<AchievementLevel>;
  firstLesson: HomeFirstLesson | null;
  continueWatching?: ContinueWatchingRepository;
  resolve?: ResolveContinueWatching;
}) {
  const learner = useLearnerProfile(profiles);
  useLearnerRedirect(learner.status, { when: "absent", to: "/start" });

  if (learner.status !== "present") {
    return <AchievementsShell />;
  }
  return (
    <LearnerAchievementsPage
      profile={learner.profile}
      level={level}
      lessonRuntimes={lessonRuntimes}
      levels={levels}
      firstLesson={firstLesson}
      continueWatching={continueWatching}
      resolve={resolve}
    />
  );
}

function LearnerAchievementsPage({
  profile,
  level,
  lessonRuntimes,
  levels,
  firstLesson,
  continueWatching,
  resolve,
}: {
  profile: LearnerProfile;
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  levels: ReadonlyArray<AchievementLevel>;
  firstLesson: HomeFirstLesson | null;
  continueWatching?: ContinueWatchingRepository;
  resolve?: ResolveContinueWatching;
}) {
  const t = useTranslations("Achievements");
  const achievements = useLearnerAchievements(levels);
  const isHydrated = useIsHydrated();
  const progress = useCourseWatchProgress(lessonRuntimes);
  const { calledModuleSlug, stopPointing } = useCalledPrize(achievements.courses);
  // Read once for the page: the closing action and the reveal dialog offer the
  // same destination, so they must not resolve it twice.
  const lastLesson = useResolvedContinueWatching({ continueWatching, resolve });
  const destination = continueDestination(lastLesson, firstLesson);

  const claim = (moduleSlug: string) => {
    const claimed = achievements.courses
      .flatMap((course) => course.modules)
      .find((module) => module.module.slug === moduleSlug);
    if (claimed === undefined) return;
    // Record it first: an Escape mid-reveal still leaves the prize claimed.
    claimPrize(moduleSlug);
    stopPointing();
    void NiceModal.show(PrizeRedeemedModal, {
      ...revealOf(claimed),
      continueHref: destination?.href ?? null,
    }).then(() => {
      focusPrize(moduleSlug);
    });
  };

  return (
    <div className="flex flex-col gap-14">
      <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-14">
        <div
          style={{ "--motion-order": 0 } as CSSProperties}
          className="achievement-rise lg:col-span-5"
        >
          <LearnerCard
            name={profile.name}
            avatar={profile.avatar}
            level={level}
            size="large"
            distinction={achievements.distinction}
            progress={{
              completed: isHydrated ? progress.completedCount : 0,
              total: progress.lessonCount,
            }}
          />
        </div>
        <div
          style={{ "--motion-order": 1 } as CSSProperties}
          className="achievement-rise flex flex-col items-start gap-6 lg:col-span-7"
        >
          <div className="flex flex-col gap-2">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="font-sans text-[1.875rem] leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-[2.625rem]">
              {t("heading")}
            </h1>
            <p className="text-[0.9375rem] text-muted-foreground">{t("intro")}</p>
          </div>
          <button
            type="button"
            onClick={() => void NiceModal.show(AchievementsGuideModal)}
            className="inline-flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-[0.625rem] border border-border bg-foreground/5 px-[1.375rem] text-[0.9375rem] font-bold text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("howItWorks")}
          </button>
        </div>
      </div>
      <LearnerAchievements
        achievements={achievements}
        onClaim={claim}
        calledModuleSlug={calledModuleSlug ?? undefined}
      />
      <ContinueCourse
        destination={destination}
        isResolving={lastLesson.status === "resolving"}
      />
    </div>
  );
}

/** Where the page and the reveal dialog both send the learner on from here. */
type ContinueDestination = { href: string; kind: "lesson" | "course" };

/**
 * The one destination this page offers, for the closing action and the reveal.
 *
 * @remarks
 * `null` while the record is still resolving — offering the first lesson then
 * would send a learner who *does* have a lesson to the start of the course,
 * which is the one outcome worth guarding against. With nothing to continue —
 * no record, or one that no longer resolves — the first lesson is the honest
 * offer, so a learner who has only claimed a prize is never left without a next
 * step.
 */
function continueDestination(
  lastLesson: ResolvedContinueWatching,
  firstLesson: HomeFirstLesson | null,
): ContinueDestination | null {
  if (lastLesson.status === "resolving") return null;
  if (lastLesson.status === "resolved") {
    return { href: lastLesson.panel.lessonHref, kind: "lesson" };
  }
  return firstLesson ? { href: firstLesson.href, kind: "course" } : null;
}

/** The way back into the course, closing the page. */
function ContinueCourse({
  destination,
  isResolving,
}: {
  destination: ContinueDestination | null;
  isResolving: boolean;
}) {
  const t = useTranslations("Achievements");

  if (isResolving) {
    return (
      <div
        data-testid="continue-course-skeleton"
        aria-hidden="true"
      >
        <Skeleton className="h-12 w-60 rounded-lg" />
      </div>
    );
  }
  if (destination === null) return null;

  return (
    <div className="flex">
      <Link
        href={destination.href as never}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-[0.9375rem] font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Play
          aria-hidden="true"
          className="size-4 shrink-0"
          fill="currentColor"
        />
        {destination.kind === "lesson" ? t("continueCourse") : t("startCourse")}
      </Link>
    </div>
  );
}

/**
 * The prize the learner came to claim, asked for in the URL by the dialog that
 * sent them here.
 *
 * @remarks
 * The request is read straight from the URL rather than copied into state, and
 * it is dropped when the learner claims that prize — so the counter points at it
 * for exactly as long as it is theirs to take.
 *
 * It only counts while the counter actually holds a prize of that module ready
 * to claim: the shelves are derived from this device's storage, so on the first
 * render there is nothing to point at yet — which is also why a `#prize-…`
 * anchor could never have done this job.
 */
function useCalledPrize(courses: ReadonlyArray<CourseAchievements>): {
  calledModuleSlug: string | null;
  stopPointing: () => void;
} {
  const [claimed, setClaimed] = useQueryState("claim");

  const isReadyToClaim = courses
    .flatMap((course) => course.modules)
    .some((module) => module.module.slug === claimed && module.prizeState === "ready");
  const calledModuleSlug = isReadyToClaim ? claimed : null;

  useEffect(() => {
    if (calledModuleSlug === null) return;
    const prize = document.querySelector<HTMLElement>(`[data-prize-slug="${calledModuleSlug}"]`);
    prize?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    prize?.focus();
  }, [calledModuleSlug]);

  return { calledModuleSlug, stopPointing: () => void setClaimed(null) };
}

/** Whether the learner has asked for less movement; unknown counts as no. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** What the reveal dialog needs to know about the prize just claimed. */
function revealOf({ prize, module, tickets }: ModuleAchievements) {
  return { prize, moduleTitle: module.title, ticketCount: tickets.length };
}

/**
 * Sends focus back to the prize that was revealed.
 *
 * @remarks
 * The control that opened the dialog was the Claim prize button, which the claim
 * itself removes, so there is nothing for the dialog to return focus to. The
 * shelf item takes it instead — by then it names the prize.
 */
function focusPrize(moduleSlug: string): void {
  document.querySelector<HTMLElement>(`[data-prize-slug="${moduleSlug}"]`)?.focus();
}

/** The page's shape while storage has not said whose achievements these are. */
function AchievementsShell() {
  return (
    <div
      data-testid="achievements-shell"
      aria-hidden="true"
      className="flex flex-col gap-14"
    >
      <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-14">
        <Skeleton className="h-56 w-full rounded-[1.25rem] lg:col-span-5" />
        <div className="flex flex-col gap-4 lg:col-span-7">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-13 w-40 rounded-[0.625rem]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-[0.875rem]" />
        <Skeleton className="h-24 rounded-[0.875rem]" />
      </div>
    </div>
  );
}
