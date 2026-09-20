// @vitest-environment node
import { earnedTicket } from "@/adapters/persistence/turso/schema/schema";
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

import { TursoEarnedTicketRepository } from "./turso-earned-ticket-repository";

const aLesson = () => LessonId.parse(faker.string.uuid());

describe.skipIf(!DOCKER_AVAILABLE)("TursoEarnedTicketRepository (integration)", () => {
  let libsql: StartedLibsql;
  const ticketsFor = (learnerId: string) =>
    new TursoEarnedTicketRepository(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("a learner with no tickets has none", async () => {
    expect((await ticketsFor(await insertTestUser(libsql.database)).list()).size).toBe(0);
  });

  test("overlapping batches keep one row per lesson", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const [a, b, c] = [aLesson(), aLesson(), aLesson()];

    await ticketsFor(learnerId).earn([a, b]);
    await ticketsFor(learnerId).earn([b, c]);

    expect(await ticketsFor(learnerId).list()).toEqual(new Set([a, b, c]));
    expect(await libsql.database.$count(earnedTicket, eq(earnedTicket.userId, learnerId))).toBe(3);
  });

  test("an empty batch writes nothing and does not fail", async () => {
    const learnerId = await insertTestUser(libsql.database);

    await ticketsFor(learnerId).earn([]);

    expect((await ticketsFor(learnerId).list()).size).toBe(0);
  });

  test("one learner's tickets are not another's", async () => {
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await ticketsFor(ana).earn([aLesson()]);

    expect((await ticketsFor(ben).list()).size).toBe(0);
  });
});
