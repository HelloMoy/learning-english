"use client";

import { earnTickets, useEarnedTickets } from "@/hooks/use-earned-tickets/use-earned-tickets";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useClaimedPrizes } from "@/hooks/use-prize-claims/use-prize-claims";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import {
  learnerAchievements,
  type AchievementLevel,
  type LearnerAchievements,
} from "@/lib/learner-achievements/learner-achievements";
import { countsAsComplete } from "@/lib/watch-progress/watch-progress";

import { useEffect } from "react";

/**
 * The learner's tickets, prizes and distinction, as this device's progress
 * stands.
 *
 * @remarks
 * A ticket is earned the first time its lesson counts as complete, by the same
 * rule `useCourseWatchProgress` counts with — marked complete, or watched past
 * the finish threshold — so an achievement can never disagree with a progress
 * meter on the way up. The ticket is then stored and kept, which is why
 * un-marking a lesson no longer takes it away.
 *
 * Reading the achievements is also what records tickets for lessons that were
 * already complete, so a device that finished lessons before tickets were
 * stored keeps them from its first visit here.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @example
 * ```tsx
 * const { ticketsEarned, ticketCount, distinction } = useLearnerAchievements(levels);
 * ```
 *
 * @param levels - Every catalog course with its modules and lesson slices
 * @returns The derived achievements
 */
export function useLearnerAchievements(
  levels: ReadonlyArray<AchievementLevel>,
): LearnerAchievements {
  const completedLessons = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  const earnedTickets = useEarnedTickets();
  const claimedPrizes = useClaimedPrizes();

  const completeLessonIds = new Set<string>(
    levels
      .flatMap((level) => level.lessonRuntimes)
      .filter((lesson) =>
        countsAsComplete({
          isMarkedComplete: completedLessons.has(lesson.id),
          positionSeconds: positions.get(lesson.id) ?? null,
          durationSeconds: lesson.durationSeconds,
        }),
      )
      .map((lesson) => lesson.id),
  );

  // Records the tickets of lessons that were complete before tickets were
  // stored. `earnTickets` writes and notifies only what is new, so running it
  // after every render settles at once instead of looping.
  useEffect(() => {
    earnTickets([...completeLessonIds]);
  });

  return learnerAchievements({
    levels,
    isEarned: (lesson) => earnedTickets.has(lesson.id) || completeLessonIds.has(lesson.id),
    isClaimed: (module) => claimedPrizes.has(module.slug),
  });
}
