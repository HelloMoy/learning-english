// @vitest-environment node
import { playbackPosition } from "@/adapters/persistence/turso/schema/schema";
import { LessonId } from "@/domain/entities/ids/ids";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { TursoPlaybackPositionRepository } from "./turso-playback-position-repository";

const aLesson = () => LessonId.parse(faker.string.uuid());

describe.skipIf(!DOCKER_AVAILABLE)("TursoPlaybackPositionRepository (integration)", () => {
  let libsql: StartedLibsql;
  const positionsFor = (learnerId: string) =>
    new TursoPlaybackPositionRepository(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("a saved position round-trips", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const lesson = aLesson();

    await positionsFor(learnerId).setPosition(lesson, 123.5);

    expect(await positionsFor(learnerId).getPosition(lesson)).toBe(123.5);
  });

  test("an unsaved lesson reads as null", async () => {
    const learnerId = await insertTestUser(libsql.database);

    expect(await positionsFor(learnerId).getPosition(aLesson())).toBeNull();
  });

  test("a repeated write keeps one row, carrying the second value", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const lesson = aLesson();

    await positionsFor(learnerId).setPosition(lesson, 10);
    await positionsFor(learnerId).setPosition(lesson, 20);

    expect(
      await libsql.database.$count(playbackPosition, eq(playbackPosition.userId, learnerId)),
    ).toBe(1);
    expect(await positionsFor(learnerId).getPosition(lesson)).toBe(20);
  });

  test("lessons and learners are isolated", async () => {
    const lesson = aLesson();
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await positionsFor(ana).setPosition(lesson, 60);

    expect(await positionsFor(ana).getPosition(aLesson())).toBeNull();
    expect(await positionsFor(ben).getPosition(lesson)).toBeNull();
  });
});
