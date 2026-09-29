// @vitest-environment node
import { courseEnrollment } from "@/adapters/persistence/turso/schema/schema";
import { Slug } from "@/domain/entities/slug/slug";
import {
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { TursoCourseEnrollmentRepository } from "./turso-course-enrollment-repository";

const basicCourse = Slug.parse("basic-course");
const advancedCourse = Slug.parse("advanced-intermediate-course");

describe.skipIf(!DOCKER_AVAILABLE)("TursoCourseEnrollmentRepository (integration)", () => {
  let libsql: StartedLibsql;
  const enrollmentsFor = (learnerId: string) =>
    new TursoCourseEnrollmentRepository(libsql.database, learnerId);

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("a learner who never enrolled lists nothing", async () => {
    const learnerId = await insertTestUser(libsql.database);

    expect((await enrollmentsFor(learnerId).list()).size).toBe(0);
  });

  test("enrolling twice keeps one enrollment", async () => {
    const learnerId = await insertTestUser(libsql.database);

    await enrollmentsFor(learnerId).enroll(basicCourse);
    await enrollmentsFor(learnerId).enroll(basicCourse);

    expect(await enrollmentsFor(learnerId).list()).toEqual(new Set([basicCourse]));
  });

  test("a learner can hold several courses", async () => {
    const learnerId = await insertTestUser(libsql.database);

    await enrollmentsFor(learnerId).enroll(basicCourse);
    await enrollmentsFor(learnerId).enroll(advancedCourse);

    expect(await enrollmentsFor(learnerId).list()).toEqual(new Set([basicCourse, advancedCourse]));
  });

  test("enrollments are isolated per learner", async () => {
    const [ana, ben] = [
      await insertTestUser(libsql.database),
      await insertTestUser(libsql.database),
    ];

    await enrollmentsFor(ana).enroll(advancedCourse);

    expect((await enrollmentsFor(ben).list()).size).toBe(0);
  });

  test("a stored slug that no longer parses is left out", async () => {
    const learnerId = await insertTestUser(libsql.database);
    // A slug is at least three characters; anything shorter was never valid.
    await libsql.database.insert(courseEnrollment).values({ userId: learnerId, courseSlug: "ab" });

    expect((await enrollmentsFor(learnerId).list()).size).toBe(0);
  });
});
