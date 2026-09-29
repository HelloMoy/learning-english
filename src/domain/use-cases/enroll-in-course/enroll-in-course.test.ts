import { Course } from "@/domain/entities/course/course";
import { Slug } from "@/domain/entities/slug/slug";
import {
  makeStubCourseEnrollmentRepository,
  makeStubCourseRepository,
} from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { makeEnrollInCourse } from "./enroll-in-course";

const aCourse = () =>
  Course.parse({
    id: faker.string.uuid(),
    slug: faker.lorem.slug({ min: 2, max: 4 }),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: 48,
    moduleCount: 5,
    sequence: 1,
  });

describe("enrollInCourse", () => {
  describe("GIVEN a course the catalog serves", () => {
    test("WHEN the learner enrolls THEN it resolves with { enrolled: true } and the course is held", async () => {
      // Arrange
      const course = aCourse();
      const enrollments = makeStubCourseEnrollmentRepository();
      const enrollInCourse = makeEnrollInCourse({
        courses: makeStubCourseRepository({ courses: [course] }),
        enrollments,
      });

      // Act
      const result = await enrollInCourse({ courseSlug: course.slug });

      // Assert
      expect(result.isOk() && result.value).toEqual({ enrolled: true });
      expect(await enrollments.list()).toEqual(new Set([course.slug]));
    });
  });

  describe("GIVEN a slug the catalog does not serve", () => {
    test("WHEN the learner enrolls THEN it resolves with course-not-found and nothing is held", async () => {
      // Arrange
      const enrollments = makeStubCourseEnrollmentRepository();
      const enrollInCourse = makeEnrollInCourse({
        courses: makeStubCourseRepository({ courses: [aCourse()] }),
        enrollments,
      });

      // Act
      const result = await enrollInCourse({ courseSlug: Slug.parse("hidden-draft-course") });

      // Assert
      expect(result.isErr() && result.error).toEqual({ kind: "course-not-found" });
      expect((await enrollments.list()).size).toBe(0);
    });
  });

  describe("GIVEN storage that rejects the write", () => {
    test("WHEN the learner enrolls THEN it resolves with internal-error", async () => {
      // Arrange
      const course = aCourse();
      const enrollments = makeStubCourseEnrollmentRepository({ enrollRejects: true });
      const enrollInCourse = makeEnrollInCourse({
        courses: makeStubCourseRepository({ courses: [course] }),
        enrollments,
      });

      // Act
      const result = await enrollInCourse({ courseSlug: course.slug });

      // Assert
      expect(result.isErr() && result.error.kind).toBe("internal-error");
    });
  });
});
