// @vitest-environment node
import { learnerProfile } from "@/adapters/persistence/turso/schema/schema";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { TursoLearnerProfileRepository } from "./turso-learner-profile-repository";

describe.skipIf(!DOCKER_AVAILABLE)("TursoLearnerProfileRepository (integration)", () => {
  let libsql: StartedLibsql;
  const profilesFor = (learnerId: string) =>
    new TursoLearnerProfileRepository(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("no profile reads as null", async () => {
    expect(await profilesFor(await insertTestUser(libsql.database)).get()).toBeNull();
  });

  test.each([
    ["initials", { kind: "initials" }],
    ["an illustration", { kind: "illustration", id: "plum" }],
  ] as const)("a profile with %s round-trips", async (_, avatar) => {
    const learnerId = await insertTestUser(libsql.database);
    const profile = LearnerProfile.parse({ name: "Ana García", avatar });

    await profilesFor(learnerId).set(profile);

    expect(await profilesFor(learnerId).get()).toEqual(profile);
  });

  test("saving again replaces the one profile", async () => {
    const learnerId = await insertTestUser(libsql.database);
    await profilesFor(learnerId).set(
      LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } }),
    );
    const latest = LearnerProfile.parse({
      name: "Ana María",
      avatar: { kind: "illustration", id: "wave" },
    });

    await profilesFor(learnerId).set(latest);

    expect(await profilesFor(learnerId).get()).toEqual(latest);
  });

  test("a row with an unknown illustration reads as null", async () => {
    const learnerId = await insertTestUser(libsql.database);
    await libsql.database.insert(learnerProfile).values({
      userId: learnerId,
      name: "Ana",
      avatarKind: "illustration",
      avatarIllustrationId: "dragon",
    });

    expect(await profilesFor(learnerId).get()).toBeNull();
  });
});
