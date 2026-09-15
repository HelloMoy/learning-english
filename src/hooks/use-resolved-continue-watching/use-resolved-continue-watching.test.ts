import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { faker } from "@faker-js/faker";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useResolvedContinueWatching } from "./use-resolved-continue-watching";

const location = ContinueWatchingLocation.parse({
  courseSlug: faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
  moduleSlug: faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
  lessonId: faker.string.uuid(),
});

const panel: ContinueWatchingPanel = {
  courseSlug: location.courseSlug,
  courseTitle: faker.lorem.words(2),
  moduleId: faker.string.uuid(),
  moduleSequence: faker.number.int({ min: 1, max: 10 }),
  moduleTitle: faker.lorem.words(2),
  lessonSequence: faker.number.int({ min: 1, max: 30 }),
  lessonTitle: faker.lorem.words(3),
  lessonHref: `/courses/${location.courseSlug}/modules/${location.moduleSlug}/lessons/${location.lessonId}`,
  durationSeconds: faker.number.int({ min: 60, max: 900 }),
};

const storing = (stored: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => stored,
  set: async () => {},
});

const neverAnswers = () => new Promise<ContinueWatchingPanel | null>(() => {});

/**
 * The fakes are built once per test, outside the render callback. A fresh
 * repository on every render is a new dependency on every render, which no
 * real caller does — the defaults are module-level singletons.
 */
describe("useResolvedContinueWatching", () => {
  describe("GIVEN the first render, before storage has answered", () => {
    test("WHEN the state is read THEN nothing is offered, as the server rendered it", () => {
      const options = { continueWatching: storing(location), resolve: neverAnswers };

      const { result } = renderHook(() => useResolvedContinueWatching(options));

      expect(result.current).toEqual({ status: "none" });
    });
  });

  describe("GIVEN no stored location", () => {
    test("WHEN storage answers THEN the state stays none and nothing is resolved", async () => {
      let resolveCalls = 0;
      const options = {
        continueWatching: storing(null),
        resolve: async () => {
          resolveCalls += 1;
          return panel;
        },
      };

      const { result } = renderHook(() => useResolvedContinueWatching(options));

      await waitFor(() => expect(result.current).toEqual({ status: "none" }));
      expect(resolveCalls).toBe(0);
    });
  });

  describe("GIVEN a stored location", () => {
    test("WHEN the resolution has not answered THEN the state is resolving", async () => {
      const options = { continueWatching: storing(location), resolve: neverAnswers };

      const { result } = renderHook(() => useResolvedContinueWatching(options));

      await waitFor(() => expect(result.current).toEqual({ status: "resolving" }));
    });

    test("WHEN it resolves to a live lesson THEN the state is resolved with that panel", async () => {
      const options = { continueWatching: storing(location), resolve: async () => panel };

      const { result } = renderHook(() => useResolvedContinueWatching(options));

      // The lesson id rides along with the panel: the resume panel reads the saved
      // playback position by it, and the panel itself carries no id.
      await waitFor(() =>
        expect(result.current).toEqual({ status: "resolved", panel, lessonId: location.lessonId }),
      );
    });

    test("WHEN it no longer resolves THEN the state falls back to none", async () => {
      // The transient `resolving` render is not asserted here: an instant
      // answer is batched with it. The test above covers the pending window.
      let resolveCalls = 0;
      const options = {
        continueWatching: storing(location),
        resolve: async () => {
          resolveCalls += 1;
          return null;
        },
      };

      const { result } = renderHook(() => useResolvedContinueWatching(options));

      await waitFor(() => expect(resolveCalls).toBe(1));
      await waitFor(() => expect(result.current).toEqual({ status: "none" }));
    });
  });
});
