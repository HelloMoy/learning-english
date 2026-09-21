"use client";

import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import { ProgressRing } from "@/components/progress-ring/progress-ring";
import type { LearnerAvatar } from "@/domain/entities/learner-profile/learner-profile";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useLearnerAchievements } from "@/hooks/use-learner-achievements/use-learner-achievements";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";

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
  /** The level's lessons, which the progress panel counts. */
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  /** Every catalog course, which the tickets and prizes are counted across. */
  levels: ReadonlyArray<AchievementLevel>;
};

/**
 * The band that opens the Profile page: the learner card beside what the
 * learner has done — the level's completed share, the tickets they have
 * earned and the prizes they have claimed.
 *
 * @remarks
 * The card is the real card, not a labelled preview: it follows the name being
 * typed and the avatar being picked, which is why the band takes them as
 * values rather than reading the stored profile itself.
 *
 * Every figure reads zero until hydration commits, the same rule the card's
 * own progress line follows, because the learner's progress lives in the
 * browser's store and the server has no figure to render. The rows are sized
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

  const completed = isHydrated ? watched.completedCount : 0;
  const share = isHydrated ? watched.completedFraction : 0;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
      <div className="lg:w-[26rem] lg:flex-none">
        <LearnerCard
          name={name}
          avatar={avatar}
          level={level}
          size="large"
          progress={{ completed, total: watched.lessonCount }}
        />
      </div>
      <section
        aria-labelledby="profile-progress-label"
        data-testid="profile-progress"
        className="flex flex-1 flex-col justify-center gap-5 rounded-[1.125rem] border border-border bg-card p-5 sm:p-6"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <ProgressRing
            size={76}
            fraction={share}
          >
            <span className="text-[15px] font-extrabold text-popover-foreground tabular-nums">
              {t("percent", { percent: share })}
            </span>
          </ProgressRing>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p
              id="profile-progress-label"
              className="text-[13px] font-semibold text-muted-foreground"
            >
              {t("heading", { course: level.courseTitle })}
            </p>
            <p className="text-xl leading-tight font-extrabold tracking-tight text-foreground tabular-nums">
              {t("videos", { completed, total: watched.lessonCount })}
            </p>
            <span
              aria-hidden="true"
              className="h-1.5 w-full max-w-[18rem] overflow-hidden rounded-full bg-border"
            >
              <span
                className="block h-full rounded-full bg-gradient-to-r from-bronze to-gold transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${share * 100}%` }}
              />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            testId="tickets-earned"
            value={isHydrated ? achievements.ticketsEarned : 0}
            label={t("ticketsLabel")}
          />
          <Stat
            testId="prizes-claimed"
            value={isHydrated ? achievements.prizesRedeemed : 0}
            label={t("prizesLabel")}
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ testId, value, label }: { testId: string; value: number; label: string }) {
  const format = useFormatter();

  return (
    <p
      data-testid={testId}
      className="flex flex-col gap-0.5 rounded-xl border border-border bg-panel-2 px-4 py-3"
    >
      <span className="text-2xl leading-none font-extrabold tracking-tight text-foreground tabular-nums">
        {format.number(value)}
      </span>
      <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
    </p>
  );
}
