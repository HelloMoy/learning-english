import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

import { LearnerStoreContinueWatchingRepository } from "./learner-store-continue-watching-repository";

const aLocationIn = (courseSlug: string) =>
  ContinueWatchingLocation.parse({
    courseSlug,
    moduleSlug: "2-vowels",
    lessonId: faker.string.uuid(),
  });

const heldLocations = () =>
  learnerStore.getState().continueWatching.map((record) => record.location);

describe("LearnerStoreContinueWatchingRepository", () => {
  test("WHEN nothing is recorded THEN it reads as null and an empty list", async () => {
    const locations = new LearnerStoreContinueWatchingRepository({ record: vi.fn() });

    expect(await locations.get()).toBeNull();
    expect(await locations.list()).toEqual([]);
  });

  test("WHEN the learner's snapshot holds places in two courses THEN the most recent is the one read", async () => {
    const [advanced, basic] = [
      aLocationIn("advanced-intermediate-course"),
      aLocationIn("basic-course"),
    ];
    givenLearner.continueWatchingByCourse([
      { location: advanced, watchedAt: 2 },
      { location: basic, watchedAt: 1 },
    ]);

    const locations = new LearnerStoreContinueWatchingRepository({ record: vi.fn() });

    expect(await locations.get()).toEqual(advanced);
    expect((await locations.list()).map((record) => record.location)).toEqual([advanced, basic]);
  });

  test("WHEN a location is set THEN it is saved and replaces only its course's place, at the head", async () => {
    const [basic, advanced] = [
      aLocationIn("basic-course"),
      aLocationIn("advanced-intermediate-course"),
    ];
    givenLearner.continueWatchingByCourse([
      { location: basic, watchedAt: 2 },
      { location: advanced, watchedAt: 1 },
    ]);
    const record = vi.fn(async () => true);
    const advancedAgain = aLocationIn("advanced-intermediate-course");

    await new LearnerStoreContinueWatchingRepository({ record }).set(advancedAgain);

    expect(record).toHaveBeenCalledWith(advancedAgain);
    expect(heldLocations()).toEqual([advancedAgain, basic]);
  });

  test("WHEN a location is set THEN the learner is enrolled in its course", async () => {
    await new LearnerStoreContinueWatchingRepository({ record: async () => true }).set(
      aLocationIn("advanced-intermediate-course"),
    );

    expect(learnerStore.getState().enrolledCourses.has("advanced-intermediate-course")).toBe(true);
  });

  test("WHEN a lesson of an enrolled course is recorded THEN the enrollments are unchanged", async () => {
    givenLearner.enrolledCourses(["basic-course"]);

    await new LearnerStoreContinueWatchingRepository({ record: async () => true }).set(
      aLocationIn("basic-course"),
    );

    expect([...learnerStore.getState().enrolledCourses]).toEqual(["basic-course"]);
  });

  test("WHEN the server refuses THEN the previous places and enrollments come back, and nothing is thrown", async () => {
    const previous = aLocationIn("basic-course");
    givenLearner.continueWatching(previous);
    givenLearner.enrolledCourses(["basic-course"]);

    await new LearnerStoreContinueWatchingRepository({ record: async () => false }).set(
      aLocationIn("advanced-intermediate-course"),
    );

    expect(heldLocations()).toEqual([previous]);
    expect([...learnerStore.getState().enrolledCourses]).toEqual(["basic-course"]);
  });
});
