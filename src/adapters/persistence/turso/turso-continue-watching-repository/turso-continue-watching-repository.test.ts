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

const aLocation = () =>
  ContinueWatchingLocation.parse({
    courseSlug: "basic-course",
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

  test("an empty store resolves to null", async () => {
    expect(await locationsFor(await insertTestUser(libsql.database)).get()).toBeNull();
  });

  test("the store holds one location: the latest", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const [first, latest] = [aLocation(), aLocation()];

    await locationsFor(learnerId).set(first);
    await locationsFor(learnerId).set(latest);

    expect(await locationsFor(learnerId).get()).toEqual(latest);
  });

  test("a row that no longer parses reads as null", async () => {
    const learnerId = await insertTestUser(libsql.database);
    await libsql.database
      .insert(continueWatching)
      .values({ userId: learnerId, courseSlug: "x", moduleSlug: "y", lessonId: "not-a-uuid" });

    expect(await locationsFor(learnerId).get()).toBeNull();
  });

  test("learners are isolated", async () => {
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await locationsFor(ana).set(aLocation());

    expect(await locationsFor(ben).get()).toBeNull();
  });
});
