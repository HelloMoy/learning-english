import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { makeEnrollInCourse } from "@/domain/use-cases/enroll-in-course/enroll-in-course";
import {
  makeStubContinueWatchingRepository,
  makeStubCourseEnrollmentRepository,
  makeStubCourseRepository,
} from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { makeRecordContinueWatching } from "./record-continue-watching";

const aCourse = () =>
  Course.parse({
    id: faker.string.uuid(),
    slug: faker.lorem.slug({ min: 2, max: 4 }),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: 10,
    moduleCount: 2,
    track: "level",
    sequence: 1,
  });

const aLocationIn = (courseSlug: string) =>
  ContinueWatchingLocation.parse({
    courseSlug,
    moduleSlug: faker.lorem.slug({ min: 2, max: 3 }),
    lessonId: faker.string.uuid(),
  });

function arrange(options: { courses: Course[]; setRejects?: boolean }) {
  const enrollments = makeStubCourseEnrollmentRepository();
  const continueWatching = makeStubContinueWatchingRepository({ setRejects: options.setRejects });
  const enrollInCourse = makeEnrollInCourse({
    courses: makeStubCourseRepository({ courses: options.courses }),
    enrollments,
  });
  const recordContinueWatching = makeRecordContinueWatching({ enrollInCourse, continueWatching });
  return { enrollments, continueWatching, recordContinueWatching };
}

describe("recordContinueWatching", () => {
  describe("GIVEN a lesson location in a served course", () => {
    test("WHEN it is recorded THEN the learner is enrolled and the location is stored", async () => {
      // Arrange
      const course = aCourse();
      const location = aLocationIn(course.slug);
      const { enrollments, continueWatching, recordContinueWatching } = arrange({
        courses: [course],
      });

      // Act
      const result = await recordContinueWatching(location);

      // Assert
      expect(result.isOk() && result.value).toEqual({ recorded: true });
      expect(await enrollments.list()).toEqual(new Set([course.slug]));
      expect(await continueWatching.get()).toEqual(location);
    });
  });

  describe("GIVEN a location in a course the catalog does not serve", () => {
    test("WHEN it is recorded THEN neither the enrollment nor the location is stored", async () => {
      // Arrange
      const location = aLocationIn("hidden-draft-course");
      const { enrollments, continueWatching, recordContinueWatching } = arrange({
        courses: [aCourse()],
      });

      // Act
      const result = await recordContinueWatching(location);

      // Assert
      expect(result.isErr() && result.error).toEqual({ kind: "course-not-found" });
      expect((await enrollments.list()).size).toBe(0);
      expect(await continueWatching.get()).toBeNull();
    });
  });

  describe("GIVEN storage that rejects the location", () => {
    test("WHEN it is recorded THEN it resolves with internal-error", async () => {
      // Arrange
      const course = aCourse();
      const { recordContinueWatching } = arrange({ courses: [course], setRejects: true });

      // Act
      const result = await recordContinueWatching(aLocationIn(course.slug));

      // Assert
      expect(result.isErr() && result.error.kind).toBe("internal-error");
    });
  });
});
