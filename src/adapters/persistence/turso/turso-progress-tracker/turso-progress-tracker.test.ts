// @vitest-environment node
import { LessonId } from "@/domain/entities/ids/ids";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { TursoProgressTracker } from "./turso-progress-tracker";

const aLesson = () => LessonId.parse(faker.string.uuid());

describe.skipIf(!DOCKER_AVAILABLE)("TursoProgressTracker (integration)", () => {
  let libsql: StartedLibsql;
  const trackerFor = (learnerId: string) => new TursoProgressTracker(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("a mark round-trips through a new tracker for the same learner", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const lesson = aLesson();

    await trackerFor(learnerId).markComplete(lesson);

    expect(await trackerFor(learnerId).isComplete(lesson)).toBe(true);
  });

  test("an unmarked lesson reads as incomplete", async () => {
    const learnerId = await insertTestUser(libsql.database);

    expect(await trackerFor(learnerId).isComplete(aLesson())).toBe(false);
  });

  test("marking twice and un-marking twice are both idempotent", async () => {
    const tracker = trackerFor(await insertTestUser(libsql.database));
    const lesson = aLesson();

    await tracker.markComplete(lesson);
    await tracker.markComplete(lesson);
    expect(await tracker.isComplete(lesson)).toBe(true);
    await tracker.unmarkComplete(lesson);
    await tracker.unmarkComplete(lesson);
    expect(await tracker.isComplete(lesson)).toBe(false);
  });

  test("un-marking one lesson leaves the others complete", async () => {
    const tracker = trackerFor(await insertTestUser(libsql.database));
    const [kept, removed] = [aLesson(), aLesson()];
    await tracker.markComplete(kept);
    await tracker.markComplete(removed);

    await tracker.unmarkComplete(removed);

    expect(await tracker.isComplete(kept)).toBe(true);
  });

  test("one learner's mark is not another's", async () => {
    const lesson = aLesson();
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await trackerFor(ana).markComplete(lesson);

    expect(await trackerFor(ben).isComplete(lesson)).toBe(false);
  });
});
