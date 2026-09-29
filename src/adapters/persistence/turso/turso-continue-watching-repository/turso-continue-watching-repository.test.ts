// @vitest-environment node
import { continueWatching } from "@/adapters/persistence/turso/schema/schema";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { TursoContinueWatchingRepository } from "./turso-continue-watching-repository";

const aLocationIn = (courseSlug: string) =>
  ContinueWatchingLocation.parse({
    courseSlug,
    moduleSlug: "2-vowels",
    lessonId: faker.string.uuid(),
  });

describe.skipIf(!DOCKER_AVAILABLE)("TursoContinueWatchingRepository (integration)", () => {
  let libsql: StartedLibsql;
  const locationsFor = (learnerId: string) =>
    new TursoContinueWatchingRepository(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("an empty store resolves to null and an empty list", async () => {
    const locations = locationsFor(await insertTestUser(libsql.database));

    expect(await locations.get()).toBeNull();
    expect(await locations.list()).toEqual([]);
  });

  test("setting twice in one course keeps the latest, once", async () => {
    const locations = locationsFor(await insertTestUser(libsql.database));
    const [first, latest] = [aLocationIn("basic-course"), aLocationIn("basic-course")];

    await locations.set(first);
    await locations.set(latest);

    expect(await locations.get()).toEqual(latest);
    expect((await locations.list()).map((record) => record.location)).toEqual([latest]);
  });

  test("each course keeps its own location, the latest first", async () => {
    const locations = locationsFor(await insertTestUser(libsql.database));
    const [basic, advanced] = [
      aLocationIn("basic-course"),
      aLocationIn("advanced-intermediate-course"),
    ];

    await locations.set(basic);
    await locations.set(advanced);

    expect(await locations.get()).toEqual(advanced);
    expect((await locations.list()).map((record) => record.location)).toEqual([advanced, basic]);
  });

  test("returning to a course makes it the latest again", async () => {
    const locations = locationsFor(await insertTestUser(libsql.database));
    const [basic, advanced, basicAgain] = [
      aLocationIn("basic-course"),
      aLocationIn("advanced-intermediate-course"),
      aLocationIn("basic-course"),
    ];

    await locations.set(basic);
    await locations.set(advanced);
    await locations.set(basicAgain);

    expect(await locations.get()).toEqual(basicAgain);
    expect((await locations.list()).map((record) => record.location)).toEqual([
      basicAgain,
      advanced,
    ]);
  });

  test("each record carries when it was written", async () => {
    const locations = locationsFor(await insertTestUser(libsql.database));
    const before = Date.now();

    await locations.set(aLocationIn("basic-course"));

    const [record] = await locations.list();
    expect(record?.watchedAt).toBeGreaterThanOrEqual(before - 5_000);
  });

  test("a row that no longer parses is skipped", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const basic = aLocationIn("basic-course");
    await locationsFor(learnerId).set(basic);
    await libsql.database.insert(continueWatching).values({
      userId: learnerId,
      courseSlug: "advanced-intermediate-course",
      moduleSlug: "y1",
      lessonId: "not-a-uuid",
    });

    expect(await locationsFor(learnerId).get()).toEqual(basic);
    expect((await locationsFor(learnerId).list()).map((record) => record.location)).toEqual([
      basic,
    ]);
  });

  test("learners are isolated", async () => {
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await locationsFor(ana).set(aLocationIn("basic-course"));

    expect(await locationsFor(ben).get()).toBeNull();
  });
});
