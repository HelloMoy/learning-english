// @vitest-environment node
import { createLearnerRepositories } from "@/adapters/persistence/turso/learner-repositories/learner-repositories";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LessonId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Slug } from "@/domain/entities/slug/slug";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { loadLearnerSnapshot } from "./learner-snapshot";

const aLesson = () => LessonId.parse(faker.string.uuid());

describe.skipIf(!DOCKER_AVAILABLE)("loadLearnerSnapshot (integration)", () => {
  let libsql: StartedLibsql;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("a learner with no progress gets the empty snapshot", async () => {
    const learnerId = await insertTestUser(libsql.database);

    expect(await loadLearnerSnapshot(libsql.database, learnerId)).toEqual(EMPTY_LEARNER_SNAPSHOT);
  });

  test("everything written through the learner's repositories comes back in one snapshot", async () => {
    const learnerId = await insertTestUser(libsql.database);
    const repositories = createLearnerRepositories(libsql.database, learnerId);
    const [done, watching] = [aLesson(), aLesson()];
    const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });
    const location = ContinueWatchingLocation.parse({
      courseSlug: "basic-course",
      moduleSlug: "2-vowels",
      lessonId: watching,
    });
    await repositories.progress.markComplete(done);
    await repositories.positions.setPosition(watching, 61.5);
    await repositories.continueWatching.set(location);
    await repositories.profiles.set(profile);
    await repositories.tickets.earn([done]);
    await repositories.prizeClaims.claim(Slug.parse("1-introduction"));

    expect(await loadLearnerSnapshot(libsql.database, learnerId)).toEqual({
      profile,
      completedLessonIds: [done],
      positions: { [watching]: 61.5 },
      continueWatching: location,
      earnedTicketLessonIds: [done],
      claimedPrizeModuleSlugs: ["1-introduction"],
    });
  });

  test("a snapshot carries only its own learner's progress", async () => {
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];
    await createLearnerRepositories(libsql.database, ana).progress.markComplete(aLesson());

    expect((await loadLearnerSnapshot(libsql.database, ben)).completedLessonIds).toEqual([]);
  });
});
