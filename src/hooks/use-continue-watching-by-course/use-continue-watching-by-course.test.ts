import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  continueWatchingByCourseServerSnapshot,
  useContinueWatchingByCourse,
} from "./use-continue-watching-by-course";

const aLocationIn = (courseSlug: string) =>
  ContinueWatchingLocation.parse({
    courseSlug,
    moduleSlug: "2-vowels",
    lessonId: faker.string.uuid(),
  });

describe("useContinueWatchingByCourse", () => {
  test("WHEN the learner has opened nothing THEN the list is empty", () => {
    const { result } = renderHook(() => useContinueWatchingByCourse());

    expect(result.current).toEqual([]);
  });

  test("WHEN the learner's snapshot holds two courses THEN both are read, the latest first", () => {
    const records = [
      { location: aLocationIn("advanced-intermediate-course"), watchedAt: 2 },
      { location: aLocationIn("basic-course"), watchedAt: 1 },
    ];
    givenLearner.continueWatchingByCourse(records);

    const { result } = renderHook(() => useContinueWatchingByCourse());

    expect(result.current).toEqual(records);
  });

  test("WHEN rendering on the server THEN the list is empty and stable", () => {
    expect(continueWatchingByCourseServerSnapshot()).toEqual([]);
    expect(continueWatchingByCourseServerSnapshot()).toBe(continueWatchingByCourseServerSnapshot());
  });
});
