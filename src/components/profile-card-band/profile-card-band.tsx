"use client";

import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import type { LearnerAvatar } from "@/domain/entities/learner-profile/learner-profile";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useLearnerAchievements } from "@/hooks/use-learner-achievements/use-learner-achievements";
import { Link } from "@/i18n/navigation";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { cn } from "@/lib/utils/utils";

import { useFormatter, useTranslations } from "next-intl";

/**
 * Props for {@link ProfileCardBand}.
 */
export type ProfileCardBandProps = {
  /** The learner's name, as edited so far — the card previews it live. */
  name: string;
  /** The avatar chosen so far. */
  avatar: LearnerAvatar;
  /** The level the card names. */
  level: LearnerCardLevel;
  /** The level's lessons, which the card's progress line and bar count. */
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  /** Every catalog course, which the tickets and prizes are counted across. */
  levels: ReadonlyArray<AchievementLevel>;
};

/**
 * The Profile page's card column: the learner card, which carries the level's
 * progress as a count and a bar, and under it two ticket stubs counting the
 * tickets the learner has earned and the prizes they have claimed, each a link
 * to the Achievements page where those tickets are spent and prizes live.
 *
 * @remarks
 * The card is the real card, not a labelled preview: it follows the name being
 * typed and the avatar being picked, which is why the band takes them as
 * values rather than reading the stored profile itself. It is the only place
 * on the page that names the progress.
 *
 * Every figure reads zero until hydration commits, the same rule the card's
 * own progress line follows, because the learner's progress lives in the
 * browser's store and the server has no figure to render. The stubs are sized
 * by their labels rather than their numbers, so adopting the real figures
 * moves nothing on the page.
 *
 * Reading the achievements also records the tickets of lessons that were
 * already complete — see {@link useLearnerAchievements}. That write is
 * idempotent, so opening the Profile page can only bring a learner's tickets
 * up to what they have already earned.
 *
 * @example
 * ```tsx
 * <ProfileCardBand
 *   name={name}
 *   avatar={avatar}
 *   level={level}
 *   lessonRuntimes={lessonRuntimes}
 *   levels={levels}
 * />
 * ```
 *
 * @category Components
 */
export function ProfileCardBand({
  name,
  avatar,
  level,
  lessonRuntimes,
  levels,
}: ProfileCardBandProps) {
  const t = useTranslations("Profile.progress");
  const isHydrated = useIsHydrated();
  const watched = useCourseWatchProgress(lessonRuntimes);
  const achievements = useLearnerAchievements(levels);

  return (
    <div className="flex flex-col gap-3.5">
      <LearnerCard
        name={name}
        avatar={avatar}
        level={level}
        size="large"
        progress={{
          completed: isHydrated ? watched.completedCount : 0,
          total: watched.lessonCount,
        }}
        showProgressBar
      />
      <div className="grid grid-cols-2 gap-2.5">
        <CountStub
          testId="tickets-earned"
          value={isHydrated ? achievements.ticketsEarned : 0}
          label={t("ticketsLabel")}
          className="bg-ticket text-ticket-ink"
        />
        <CountStub
          testId="prizes-claimed"
          value={isHydrated ? achievements.prizesRedeemed : 0}
          label={t("prizesLabel")}
          className="bg-primary text-primary-foreground"
        />
      </div>
    </div>
  );
}

/**
 * One count on a stub notched like the lesson tickets it counts, linking to
 * the Achievements page. The focus ring is drawn inside the stub because the
 * notched mask would clip one drawn outside it.
 */
function CountStub({
  testId,
  value,
  label,
  className,
}: {
  testId: string;
  value: number;
  label: string;
  className: string;
}) {
  const format = useFormatter();

  return (
    <Link
      href="/achievements"
      data-testid={testId}
      className={cn(
        "lesson-ticket flex items-center gap-3 rounded-xl px-4 py-3 transition-[filter] hover:brightness-105 focus-visible:ring-3 focus-visible:ring-primary-foreground/75 focus-visible:outline-none focus-visible:ring-inset motion-reduce:transition-none",
        className,
      )}
    >
      <span className="text-2xl leading-none font-extrabold tracking-tight tabular-nums">
        {format.number(value)}
      </span>{" "}
      <span className="text-[11px] leading-tight font-bold tracking-[0.12em] uppercase">
        {label}
      </span>
    </Link>
  );
}
