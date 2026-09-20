// @vitest-environment node
import { Slug } from "@/domain/entities/slug/slug";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { TursoPrizeClaimRepository } from "./turso-prize-claim-repository";

const vowels = Slug.parse("2-vowels");

describe.skipIf(!DOCKER_AVAILABLE)("TursoPrizeClaimRepository (integration)", () => {
  let libsql: StartedLibsql;
  const claimsFor = (learnerId: string) =>
    new TursoPrizeClaimRepository(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("claiming twice keeps one claim", async () => {
    const learnerId = await insertTestUser(libsql.database);

    await claimsFor(learnerId).claim(vowels);
    await claimsFor(learnerId).claim(vowels);

    expect(await claimsFor(learnerId).list()).toEqual(new Set([vowels]));
  });

  test("claims are isolated per learner", async () => {
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await claimsFor(ana).claim(vowels);

    expect((await claimsFor(ben).list()).size).toBe(0);
  });
});
