"use client";

import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { toLessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useLearnerAchievements } from "@/hooks/use-learner-achievements/use-learner-achievements";
import type { AchievementLevel, PrizeState } from "@/lib/learner-achievements/learner-achievements";
import type { PrizeId } from "@/lib/module-prizes/module-prizes";

import { useMemo } from "react";

/**
 * One module's prize as the prize counter reads it, or the fact that the module
 * has none because it holds no lessons.
 */
export type ModulePrizeReading =
  | { hasPrize: false }
  | {
      hasPrize: true;
      /** The toy the module's tickets redeem. */
      prize: PrizeId;
      /** Claimed, ready to claim, collecting tickets, or locked. */
      state: PrizeState;
      /** Lessons of the module that have earned their ticket. */
      ticketsEarned: number;
      /** Lessons in the module — one ticket each. */
      ticketCount: number;
    };

/** A module that has a prize: what a surface drawing the prize is handed. */
export type ModulePrizeDetails = Extract<ModulePrizeReading, { hasPrize: true }>;

const NO_PRIZE: ModulePrizeReading = { hasPrize: false };

/**
 * Reads the prize of a single module from this device: which toy it is, its
 * state and how many of its tickets are earned.
 *
 * @remarks
 * It is the Achievements counter's own reading, narrowed to one module, so a
 * page showing the prize can never disagree with the counter: tickets stay
 * earned after an un-mark, and a claim stays claimed. Like the counter, reading
 * it records the tickets of lessons that were complete before tickets were
 * stored.
 *
 * On the server, and before storage has been read, every store is empty, so the
 * reading is `locked` with no tickets — callers that must not assert progress
 * wait for their own "read" signal before showing it.
 *
 * @example
 * ```tsx
 * const prize = useModulePrize({ course, module, lessons });
 * if (prize.hasPrize) console.log(prize.state, prize.ticketsEarned, prize.ticketCount);
 * ```
 *
 * @param props.course - The course the module belongs to
 * @param props.module - The module whose prize is read
 * @param props.lessons - The module's lessons
 * @returns The module's prize reading, or `{ hasPrize: false }` for a module with no lessons
 */
export function useModulePrize({
  course,
  module,
  lessons,
}: {
  course: Course;
  module: Module;
  lessons: ReadonlyArray<Lesson>;
}): ModulePrizeReading {
  const levels = useMemo<ReadonlyArray<AchievementLevel>>(
    () => [{ course, modules: [module], lessonRuntimes: lessons.map(toLessonProgressSlice) }],
    [course, module, lessons],
  );
  const moduleAchievements = useLearnerAchievements(levels).courses[0]?.modules[0];
  if (!moduleAchievements) return NO_PRIZE;

  return {
    hasPrize: true,
    prize: moduleAchievements.prize,
    state: moduleAchievements.prizeState,
    ticketsEarned: moduleAchievements.ticketsEarned,
    ticketCount: moduleAchievements.tickets.length,
  };
}
