"use client";

import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import {
  learnerFirstName,
  type LearnerProfile,
} from "@/domain/entities/learner-profile/learner-profile";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * The landing's closing band for a learner who already has a card: a greeting
 * by first name, their learner card with its progress, and the way back in.
 *
 * @remarks
 * It takes the place of `StartHereBand`, whose offer — minutes to a first
 * lesson — no longer describes what **Continue** does. The card's counts use
 * the same completion rule as the course overview and are withheld until
 * hydration, when the browser can read them.
 *
 * On a wide screen the copy and action sit beside the card; on a phone the card
 * comes between the heading and the action.
 *
 * @param profile - The learner on this device
 * @param level - The level line the card shows
 * @param lessonRuntimes - That level's lessons, for the card's progress line
 * @param action - The landing's primary action, as in the hero
 */
export function ContinueBand({
  profile,
  level,
  lessonRuntimes,
  action,
}: {
  profile: LearnerProfile;
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  action: ReactNode;
}) {
  const t = useTranslations("HomePage.continueBand");
  const isHydrated = useIsHydrated();
  const progress = useCourseWatchProgress(lessonRuntimes);

  return (
    <section className="grid grid-cols-1 gap-6 rounded-2xl border border-primary/55 bg-[radial-gradient(70%_160%_at_50%_0%,color-mix(in_oklab,var(--glow)_22%,var(--card)),var(--card)_70%)] px-5 py-8 text-foreground sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,27.5rem)] lg:items-center lg:gap-x-14">
      <div className="flex flex-col gap-4 sm:gap-5">
        <Eyebrow className="text-primary">{t("eyebrow")}</Eyebrow>
        <h2 className="max-w-2xl font-sans text-[1.75rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl">
          {t("heading", { name: learnerFirstName(profile.name) })}
        </h2>
      </div>
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <LearnerCard
          name={profile.name}
          avatar={profile.avatar}
          level={level}
          progress={{
            completed: isHydrated ? progress.completedCount : 0,
            total: progress.lessonCount,
          }}
        />
      </div>
      <div className="flex flex-col sm:flex-row">{action}</div>
    </section>
  );
}
