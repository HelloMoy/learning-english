import { createClient, type Client } from "@libsql/client";

import type { LearnerAccount } from "./learner-account-fixture";

/**
 * Seeds and reads one e2e learner's rows in the Compose database.
 *
 * @remarks
 * Progress belongs to the signed-in learner (capability `learner-state`), so a
 * spec that needs a finished lesson or a saved position writes the row before
 * it opens the page — the page's snapshot then carries it, exactly as for a
 * learner who made that progress on another device. Reads let a spec assert
 * what the app saved, where it used to read `localStorage`.
 */

const DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "http://127.0.0.1:8081";

/** A learner card, as the `learner_profile` row stores it. */
export type SeededProfile = {
  name: string;
  avatar: { kind: "initials" } | { kind: "illustration"; id: string };
};

/** The one lesson location the learner opened last. */
export type SeededLocation = { courseSlug: string; moduleSlug: string; lessonId: string };

/** One learner's rows, by account. */
export type LearnerState = {
  profile: (profile: SeededProfile) => Promise<void>;
  completed: (lessonIds: ReadonlyArray<string>) => Promise<void>;
  position: (lessonId: string, seconds: number) => Promise<void>;
  continueWatching: (location: SeededLocation) => Promise<void>;
  earnedTickets: (lessonIds: ReadonlyArray<string>) => Promise<void>;
  claimedPrizes: (moduleSlugs: ReadonlyArray<string>) => Promise<void>;
  isPrizeClaimed: (moduleSlug: string) => Promise<boolean>;
  savedPosition: (lessonId: string) => Promise<number | null>;
  isCompleted: (lessonId: string) => Promise<boolean>;
  lastOpenedLessonId: () => Promise<string | null>;
};

/**
 * The rows of the learner signed in as `account`.
 *
 * @param account - An account registered through the account fixture
 * @returns Seeders and readers for that learner's progress
 */
export function learnerStateOf(account: LearnerAccount): LearnerState {
  const withLearner = <T>(run: (database: Client, userId: string) => Promise<T>) =>
    withDatabase(async (database) => run(database, await userIdOf(database, account.email)));

  return {
    profile: (profile) =>
      withLearner((database, userId) =>
        database.execute({
          sql: `insert into learner_profile (user_id, name, avatar_kind, avatar_illustration_id)
                values (?, ?, ?, ?)
                on conflict (user_id) do update set name = excluded.name,
                  avatar_kind = excluded.avatar_kind,
                  avatar_illustration_id = excluded.avatar_illustration_id`,
          args: [
            userId,
            profile.name,
            profile.avatar.kind,
            profile.avatar.kind === "illustration" ? profile.avatar.id : null,
          ],
        }),
      ).then(() => undefined),
    completed: (lessonIds) =>
      withLearner(async (database, userId) => {
        for (const lessonId of lessonIds) {
          await database.execute({
            sql: "insert or ignore into lesson_completion (user_id, lesson_id) values (?, ?)",
            args: [userId, lessonId],
          });
        }
      }),
    position: (lessonId, seconds) =>
      withLearner((database, userId) =>
        database.execute({
          sql: `insert into playback_position (user_id, lesson_id, seconds) values (?, ?, ?)
                on conflict (user_id, lesson_id) do update set seconds = excluded.seconds`,
          args: [userId, lessonId, seconds],
        }),
      ).then(() => undefined),
    continueWatching: (location) =>
      withLearner((database, userId) =>
        database.execute({
          sql: `insert into continue_watching (user_id, course_slug, module_slug, lesson_id)
                values (?, ?, ?, ?)
                on conflict (user_id) do update set course_slug = excluded.course_slug,
                  module_slug = excluded.module_slug, lesson_id = excluded.lesson_id`,
          args: [userId, location.courseSlug, location.moduleSlug, location.lessonId],
        }),
      ).then(() => undefined),
    earnedTickets: (lessonIds) =>
      withLearner(async (database, userId) => {
        for (const lessonId of lessonIds) {
          await database.execute({
            sql: "insert or ignore into earned_ticket (user_id, lesson_id) values (?, ?)",
            args: [userId, lessonId],
          });
        }
      }),
    claimedPrizes: (moduleSlugs) =>
      withLearner(async (database, userId) => {
        for (const moduleSlug of moduleSlugs) {
          await database.execute({
            sql: "insert or ignore into prize_claim (user_id, module_slug) values (?, ?)",
            args: [userId, moduleSlug],
          });
        }
      }),
    isPrizeClaimed: (moduleSlug) =>
      withLearner(async (database, userId) => {
        const result = await database.execute({
          sql: "select 1 from prize_claim where user_id = ? and module_slug = ?",
          args: [userId, moduleSlug],
        });
        return result.rows.length > 0;
      }),
    savedPosition: (lessonId) =>
      withLearner(async (database, userId) => {
        const result = await database.execute({
          sql: "select seconds from playback_position where user_id = ? and lesson_id = ?",
          args: [userId, lessonId],
        });
        const seconds = result.rows[0]?.seconds;
        return seconds === undefined || seconds === null ? null : Number(seconds);
      }),
    isCompleted: (lessonId) =>
      withLearner(async (database, userId) => {
        const result = await database.execute({
          sql: "select 1 from lesson_completion where user_id = ? and lesson_id = ?",
          args: [userId, lessonId],
        });
        return result.rows.length > 0;
      }),
    lastOpenedLessonId: () =>
      withLearner(async (database, userId) => {
        const result = await database.execute({
          sql: "select lesson_id from continue_watching where user_id = ?",
          args: [userId],
        });
        const lessonId = result.rows[0]?.lesson_id;
        return typeof lessonId === "string" ? lessonId : null;
      }),
  };
}

async function withDatabase<T>(run: (database: Client) => Promise<T>): Promise<T> {
  const database = createClient({ url: DATABASE_URL });
  try {
    return await run(database);
  } finally {
    database.close();
  }
}

async function userIdOf(database: Client, email: string): Promise<string> {
  const result = await database.execute({
    sql: "select id from user where email = ?",
    args: [email],
  });
  const id = result.rows[0]?.id;
  if (typeof id !== "string") throw new Error(`No e2e user for ${email}`);
  return id;
}
