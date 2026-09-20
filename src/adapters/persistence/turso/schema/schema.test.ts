// @vitest-environment node
import { randomUUID } from "node:crypto";

import {
  DOCKER_AVAILABLE,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  continueWatching,
  earnedTicket,
  learnerProfile,
  lessonCompletion,
  playbackPosition,
  prizeClaim,
  user,
} from "./schema";

/**
 * Guards `learner-state` § "Learner progress is stored per account in four
 * tables": every learner row cascades from its user, so deleting an account
 * can never leave progress behind.
 */
describe.skipIf(!DOCKER_AVAILABLE)("learner progress tables (integration)", () => {
  let libsql: StartedLibsql;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  async function aUser(): Promise<string> {
    const id = randomUUID();
    await libsql.database.insert(user).values({ id, name: "Ana", email: `${id}@example.com` });
    return id;
  }

  async function giveProgress(userId: string): Promise<void> {
    const lessonId = randomUUID();
    await libsql.database
      .insert(learnerProfile)
      .values({ userId, name: "Ana", avatarKind: "initials" });
    await libsql.database.insert(lessonCompletion).values({ userId, lessonId });
    await libsql.database.insert(playbackPosition).values({ userId, lessonId, seconds: 42.5 });
    await libsql.database
      .insert(continueWatching)
      .values({ userId, courseSlug: "basic-course", moduleSlug: "1-introduction", lessonId });
    await libsql.database.insert(earnedTicket).values({ userId, lessonId });
    await libsql.database.insert(prizeClaim).values({ userId, moduleSlug: "1-introduction" });
  }

  const rowsOf = async (userId: string) =>
    Promise.all(
      [
        learnerProfile,
        lessonCompletion,
        playbackPosition,
        continueWatching,
        earnedTicket,
        prizeClaim,
      ].map((table) => libsql.database.$count(table, eq(table.userId, userId))),
    );

  test("every learner table exists", async () => {
    const tables = await libsql.database.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table'`,
    );

    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining([
        "learner_profile",
        "lesson_completion",
        "playback_position",
        "continue_watching",
        "earned_ticket",
        "prize_claim",
      ]),
    );
  });

  test("deleting a user removes their progress from every learner table", async () => {
    const userId = await aUser();
    await giveProgress(userId);
    expect(await rowsOf(userId)).toEqual([1, 1, 1, 1, 1, 1]);

    await libsql.database.delete(user).where(eq(user.id, userId));

    expect(await rowsOf(userId)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  test("one learner's deletion leaves another learner's progress alone", async () => {
    const [deleted, kept] = [await aUser(), await aUser()];
    await giveProgress(deleted);
    await giveProgress(kept);

    await libsql.database.delete(user).where(eq(user.id, deleted));

    expect(await rowsOf(kept)).toEqual([1, 1, 1, 1, 1, 1]);
  });
});
