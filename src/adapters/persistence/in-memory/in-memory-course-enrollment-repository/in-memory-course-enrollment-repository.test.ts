import { Slug } from "@/domain/entities/slug/slug";

import { describe, expect, test } from "vitest";

import { InMemoryCourseEnrollmentRepository } from "./in-memory-course-enrollment-repository";

const basicCourse = Slug.parse("basic-course");

describe("InMemoryCourseEnrollmentRepository", () => {
  test("WHEN the learner never enrolled THEN the set is empty", async () => {
    expect((await new InMemoryCourseEnrollmentRepository().list()).size).toBe(0);
  });

  test("WHEN the learner enrolls twice THEN the course is held once", async () => {
    const enrollments = new InMemoryCourseEnrollmentRepository();

    await enrollments.enroll(basicCourse);
    await enrollments.enroll(basicCourse);

    expect(await enrollments.list()).toEqual(new Set([basicCourse]));
  });
});
