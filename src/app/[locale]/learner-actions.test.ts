// @vitest-environment node
import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import { getDatabase } from "@/adapters/persistence/turso/database/database";
import { loadLearnerSnapshot } from "@/adapters/persistence/turso/learner-snapshot/learner-snapshot";
import { getAuth } from "@/lib/auth/auth";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import { LEARNER_ACTION_SCHEMAS } from "./learner-action-schemas";
import {
  claimPrizeAction,
  earnTicketsAction,
  markLessonCompleteAction,
  recordContinueWatchingAction,
  recordPlaybackPositionAction,
  saveLearnerProfileAction,
  unmarkLessonCompleteAction,
} from "./learner-actions";

vi.unmock("@/app/[locale]/learner-actions");
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: vi.fn() }));
vi.mock("@/adapters/persistence/turso/database/database", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getDatabase: vi.fn(),
}));

/**
 * Guards `learner-state` § "The learner id comes only from the session" and
 * the write path behind the learner store: each action writes the signed-in
 * learner's rows through the domain use case, and nothing else.
 */
const LESSON_ID = contentCatalog.lessonRows[0]!.id;
const getSession = vi.fn();

describe.skipIf(!DOCKER_AVAILABLE)("learner actions (integration)", () => {
  let libsql: StartedLibsql;
  let learnerId: string;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
    vi.mocked(getDatabase).mockReturnValue(libsql.database);
    vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  beforeEach(async () => {
    learnerId = await insertTestUser(libsql.database);
    getSession.mockResolvedValue({ user: { id: learnerId } });
  });

  const snapshot = () => loadLearnerSnapshot(libsql.database, learnerId);

  test("marking and un-marking write the signed-in learner's completion", async () => {
    expect((await markLessonCompleteAction({ lessonId: LESSON_ID }))?.data).toEqual({
      completed: true,
    });
    expect((await snapshot()).completedLessonIds).toEqual([LESSON_ID]);

    expect((await unmarkLessonCompleteAction({ lessonId: LESSON_ID }))?.data).toEqual({
      unmarked: true,
    });
    expect((await snapshot()).completedLessonIds).toEqual([]);
  });

  test("a lesson that does not exist is not marked", async () => {
    const result = await markLessonCompleteAction({ lessonId: faker.string.uuid() as never });

    expect(result?.data).toEqual({ completed: false });
    expect((await snapshot()).completedLessonIds).toEqual([]);
  });

  test("recording a position writes it for the signed-in learner", async () => {
    await recordPlaybackPositionAction({ lessonId: LESSON_ID, seconds: 42 });

    expect((await snapshot()).positions).toEqual({ [LESSON_ID]: 42 });
  });

  test("recording where the learner is replaces the one location", async () => {
    const location = {
      courseSlug: "basic-course",
      moduleSlug: "1-introduction",
      lessonId: LESSON_ID,
    };

    await recordContinueWatchingAction(location);

    expect((await snapshot()).continueWatching).toEqual(location);
  });

  test("saving a profile stores it, and an invalid one is refused before anything is written", async () => {
    const profile = { name: "Ana García", avatar: { kind: "illustration", id: "plum" } } as const;

    expect(
      (await saveLearnerProfileAction({ name: " ", avatar: { kind: "initials" } }))
        ?.validationErrors,
    ).toBeDefined();
    expect((await snapshot()).profile).toBeNull();
    await saveLearnerProfileAction(profile);
    expect((await snapshot()).profile).toEqual(profile);
  });

  test("earning tickets records every lesson once for the signed-in learner", async () => {
    await earnTicketsAction({ lessonIds: [LESSON_ID] });
    await earnTicketsAction({ lessonIds: [LESSON_ID] });

    expect((await snapshot()).earnedTicketLessonIds).toEqual([LESSON_ID]);
  });

  test("claiming a prize records it for the signed-in learner", async () => {
    await claimPrizeAction({ moduleSlug: "1-introduction" });

    expect((await snapshot()).claimedPrizeModuleSlugs).toEqual(["1-introduction"]);
  });

  test("a malformed claim is refused before anything is written", async () => {
    expect((await claimPrizeAction({ moduleSlug: "x" }))?.validationErrors).toBeDefined();
    expect((await snapshot()).claimedPrizeModuleSlugs).toEqual([]);
  });

  test("without a session nothing is written", async () => {
    getSession.mockResolvedValue(null);

    const result = await markLessonCompleteAction({ lessonId: LESSON_ID });

    expect(result?.serverError).toBeDefined();
    expect((await snapshot()).completedLessonIds).toEqual([]);
  });

  test.each(Object.entries(LEARNER_ACTION_SCHEMAS))(
    "the %s input takes no learner or user id from the client",
    (_, schema) => {
      expect(JSON.stringify(schema.toJSONSchema())).not.toMatch(/userId|learnerId|user_id/);
    },
  );
});
