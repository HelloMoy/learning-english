import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

import { LearnerStoreContinueWatchingRepository } from "./learner-store-continue-watching-repository";

const aLocation = () =>
  ContinueWatchingLocation.parse({
    courseSlug: "basic-course",
    moduleSlug: "2-vowels",
    lessonId: faker.string.uuid(),
  });

describe("LearnerStoreContinueWatchingRepository", () => {
  test("WHEN nothing is recorded THEN it reads as null", async () => {
    const locations = new LearnerStoreContinueWatchingRepository({ record: vi.fn() });

    expect(await locations.get()).toBeNull();
  });

  test("WHEN the learner's snapshot holds a location THEN that is the one read", async () => {
    const location = aLocation();
    givenLearner.continueWatching(location);

    expect(await new LearnerStoreContinueWatchingRepository({ record: vi.fn() }).get()).toEqual(
      location,
    );
  });

  test("WHEN a location is set THEN it is saved and replaces the previous one", async () => {
    givenLearner.continueWatching(aLocation());
    const record = vi.fn(async () => true);
    const latest = aLocation();

    await new LearnerStoreContinueWatchingRepository({ record }).set(latest);

    expect(record).toHaveBeenCalledWith(latest);
    expect(learnerStore.getState().continueWatching).toEqual(latest);
  });

  test("WHEN the server refuses THEN the previous location comes back, and nothing is thrown", async () => {
    const previous = aLocation();
    givenLearner.continueWatching(previous);

    await new LearnerStoreContinueWatchingRepository({ record: async () => false }).set(
      aLocation(),
    );

    expect(learnerStore.getState().continueWatching).toEqual(previous);
  });
});
