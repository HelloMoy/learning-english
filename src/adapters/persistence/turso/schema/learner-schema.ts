import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth-schema";

// Every learner row belongs to one user and goes with it: deleting an account
// must never leave progress behind (capability `learner-state`).
const learner = () =>
  text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

// Set by SQLite, never by adapters: the domain has no clock to hand them one.
const writtenAt = () =>
  integer({ mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`);

/** The learner card: one per learner. */
export const learnerProfile = sqliteTable("learner_profile", {
  userId: learner().primaryKey(),
  name: text().notNull(),
  avatarKind: text({ enum: ["initials", "illustration"] }).notNull(),
  avatarIllustrationId: text(),
  updatedAt: writtenAt(),
});

/** One row per completed lesson; its presence is the mark. */
export const lessonCompletion = sqliteTable(
  "lesson_completion",
  { userId: learner(), lessonId: text().notNull(), completedAt: writtenAt() },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

/** The last saved position, in seconds, per learner and lesson. */
export const playbackPosition = sqliteTable(
  "playback_position",
  {
    userId: learner(),
    lessonId: text().notNull(),
    seconds: real().notNull(),
    updatedAt: writtenAt(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

/** The one lesson location the learner opened last. */
export const continueWatching = sqliteTable("continue_watching", {
  userId: learner().primaryKey(),
  courseSlug: text().notNull(),
  moduleSlug: text().notNull(),
  lessonId: text().notNull(),
  updatedAt: writtenAt(),
});

/** One row per lesson whose ticket the learner has earned; kept for good. */
export const earnedTicket = sqliteTable(
  "earned_ticket",
  { userId: learner(), lessonId: text().notNull(), earnedAt: writtenAt() },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

/** One row per module whose prize the learner has claimed; kept for good. */
export const prizeClaim = sqliteTable(
  "prize_claim",
  { userId: learner(), moduleSlug: text().notNull(), claimedAt: writtenAt() },
  (table) => [primaryKey({ columns: [table.userId, table.moduleSlug] })],
);

/**
 * Every table that holds a learner's own data. Each cascades from `user`, so
 * deleting the user deletes them all; the account-deletion suite enumerates
 * this list to prove it.
 *
 * @category Persistence
 */
export const LEARNER_TABLES = [
  learnerProfile,
  lessonCompletion,
  playbackPosition,
  continueWatching,
  earnedTicket,
  prizeClaim,
] as const;
