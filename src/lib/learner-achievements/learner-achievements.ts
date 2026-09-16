import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { prizeForModule, type PrizeId } from "@/lib/module-prizes/module-prizes";

/** The first run of text between two slashes, as in `The Vowel Sound /ɪ/`. */
const SOUND_BETWEEN_SLASHES = /\/([^/]*)\//;

/** One course of the catalog, as achievements are derived from it. */
export type AchievementLevel = {
  course: Course;
  modules: ReadonlyArray<Module>;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
};

/** Where a module's prize stands, decided from its tickets and the learner's claim. */
export type PrizeState = "claimed" | "ready" | "collecting" | "locked";

/** One lesson's ticket: the sound it carries and whether the learner has earned it. */
export type Ticket = {
  lessonId: LessonId;
  title: string;
  symbol: string;
  isEarned: boolean;
};

/** A module's prize with the tickets that redeem it, in lesson sequence order. */
export type ModuleAchievements = {
  module: Module;
  prize: PrizeId;
  prizeState: PrizeState;
  ticketsEarned: number;
  tickets: Ticket[];
};

/** A course's module prizes, in module sequence order. */
export type CourseAchievements = {
  course: Course;
  modules: ModuleAchievements[];
};

/** The learner card finish earned by completing courses. */
export type Distinction = "student" | "bronze" | "gold";

/** Every course's achievements, in catalog order, with the totals across them. */
export type LearnerAchievements = {
  courses: CourseAchievements[];
  /** Tickets earned across the catalog. */
  ticketsEarned: number;
  /** Every lesson in the catalog. */
  ticketCount: number;
  /** Prizes the learner has claimed. */
  prizesRedeemed: number;
  /** Every module holding lessons. */
  prizeCount: number;
  distinction: Distinction;
};

/** Decides whether a lesson has earned its ticket. */
export type IsTicketEarned = (lesson: LessonProgressSlice) => boolean;

/** Decides whether the learner has claimed a module's prize. */
export type IsPrizeClaimed = (module: Module) => boolean;

/**
 * The symbol a lesson's ticket shows.
 *
 * @remarks
 * Pronunciation lessons name their sound in phonetic notation between slashes,
 * so the ticket carries that sound. A title that names none — a merger lesson,
 * an exercise — falls back to the lesson's position in its module, which every
 * lesson has.
 *
 * @example
 * ```ts
 * ticketSymbol("The Vowel Sound /ɪ/ (e corta)", 2); // "ɪ"
 * ticketSymbol("The weak-vowel merger", 5); // "5"
 * ```
 *
 * @param title - The lesson title
 * @param position - The lesson's position within its module, from 1
 * @returns The first sound written between slashes, or the position
 */
export function ticketSymbol(title: string, position: number): string {
  return soundInTitle(title) ?? String(position);
}

/**
 * Derives the learner's tickets, module prizes, totals and distinction from the
 * catalog.
 *
 * @remarks
 * Nothing here is stored: achievements are recomputed from what the caller says
 * the learner has earned and claimed, which keeps this module free of storage
 * and hooks and lets the client use the same completion rule every progress
 * surface uses.
 *
 * A module's prize comes from the prize catalog by its slug. A module holding no
 * lessons has nothing to redeem, so it has no prize. A prize whose tickets are
 * all earned is `ready` until the learner claims it on the counter, and
 * `claimed` from then on — so only claimed prizes count as redeemed.
 *
 * The distinction follows tickets alone: claiming changes nothing about it.
 *
 * @example
 * ```ts
 * const { courses } = learnerAchievements({ levels, isEarned, isClaimed });
 * ```
 *
 * @param input - The catalog levels and the rules deciding earned tickets and claimed prizes
 * @returns Each course's module prizes and their tickets
 */
export function learnerAchievements({
  levels,
  isEarned,
  isClaimed,
}: {
  levels: ReadonlyArray<AchievementLevel>;
  isEarned: IsTicketEarned;
  isClaimed: IsPrizeClaimed;
}): LearnerAchievements {
  const courses = levels.map((level) => courseAchievements(level, isEarned, isClaimed));
  const modules = courses.flatMap((course) => course.modules);
  return {
    courses,
    ticketsEarned: sum(modules.map((module) => module.ticketsEarned)),
    ticketCount: sum(modules.map((module) => module.tickets.length)),
    prizesRedeemed: modules.filter((module) => module.prizeState === "claimed").length,
    prizeCount: modules.length,
    distinction: distinctionFor(courses),
  };
}

/**
 * A course with nothing to earn neither counts as complete nor stands in the
 * way of gold, so only courses holding lessons are weighed.
 */
function distinctionFor(courses: ReadonlyArray<CourseAchievements>): Distinction {
  const weighed = courses.filter((course) => course.modules.length > 0);
  const completed = weighed.filter(isCourseComplete).length;
  if (completed === 0) return "student";
  return completed === weighed.length ? "gold" : "bronze";
}

/** Complete means every ticket earned — whether or not the prizes were claimed. */
function isCourseComplete(course: CourseAchievements): boolean {
  return course.modules.every((module) => module.ticketsEarned === module.tickets.length);
}

function sum(values: ReadonlyArray<number>): number {
  return values.reduce((total, value) => total + value, 0);
}

function courseAchievements(
  level: AchievementLevel,
  isEarned: IsTicketEarned,
  isClaimed: IsPrizeClaimed,
): CourseAchievements {
  const modules = [...level.modules]
    .sort(bySequence)
    .map((module) => moduleAchievements(module, lessonsIn(level, module), isEarned, isClaimed))
    .filter((achievements) => achievements.tickets.length > 0);
  return { course: level.course, modules };
}

function moduleAchievements(
  module: Module,
  lessons: ReadonlyArray<LessonProgressSlice>,
  isEarned: IsTicketEarned,
  isClaimed: IsPrizeClaimed,
): ModuleAchievements {
  const tickets = [...lessons].sort(bySequence).map((lesson, index) => ({
    lessonId: lesson.id,
    title: lesson.title,
    symbol: ticketSymbol(lesson.title, index + 1),
    isEarned: isEarned(lesson),
  }));
  const ticketsEarned = tickets.filter((ticket) => ticket.isEarned).length;
  return {
    module,
    prize: prizeForModule(module.slug),
    prizeState: prizeState({
      ticketsEarned,
      ticketCount: tickets.length,
      isClaimed: isClaimed(module),
    }),
    ticketsEarned,
    tickets,
  };
}

function soundInTitle(title: string): string | undefined {
  const sound = SOUND_BETWEEN_SLASHES.exec(title)?.[1]?.trim();
  return sound || undefined;
}

function lessonsIn(level: AchievementLevel, module: Module): LessonProgressSlice[] {
  return level.lessonRuntimes.filter((lesson) => lesson.moduleId === module.id);
}

function prizeState({
  ticketsEarned,
  ticketCount,
  isClaimed,
}: {
  ticketsEarned: number;
  ticketCount: number;
  isClaimed: boolean;
}): PrizeState {
  if (isClaimed) return "claimed";
  if (ticketsEarned === ticketCount) return "ready";
  return ticketsEarned > 0 ? "collecting" : "locked";
}

function bySequence(left: { sequence: number }, right: { sequence: number }): number {
  return left.sequence - right.sequence;
}
