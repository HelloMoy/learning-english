import { recordContinueWatchingAction } from "@/app/[locale]/learner-actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { faker } from "@faker-js/faker";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useContinueWatching } from "./use-continue-watching";

vi.mock("@/app/[locale]/learner-actions", () => ({
  recordContinueWatchingAction: vi.fn(async () => ({ data: { recorded: true } })),
}));

const buildLocation = () =>
  ContinueWatchingLocation.parse({
    courseSlug: faker.lorem.slug({ min: 3, max: 8 }),
    moduleSlug: faker.lorem.slug({ min: 3, max: 8 }),
    lessonId: faker.string.uuid(),
  });

/** A `ContinueWatchingRepository` over one nullable slot. */
function makeFakeRepository(initial?: ContinueWatchingLocation): ContinueWatchingRepository {
  let stored = initial ?? null;
  return {
    get: async () => stored,
    set: async (location) => {
      stored = location;
    },
  };
}

describe("useContinueWatching", () => {
  describe("GIVEN a record already in storage", () => {
    test("WHEN `get` is called THEN it resolves to that location", async () => {
      // Arrange
      const location = buildLocation();
      const repository = makeFakeRepository(location);
      const { result } = renderHook(() => useContinueWatching(repository));

      // Act
      const stored = await result.current.get();

      // Assert
      expect(stored).toEqual(location);
    });
  });

  describe("GIVEN an empty store", () => {
    test("WHEN `get` is called THEN it resolves to `null`", async () => {
      // Arrange
      const { result } = renderHook(() => useContinueWatching(makeFakeRepository()));

      // Act
      const stored = await result.current.get();

      // Assert
      expect(stored).toBeNull();
    });
  });

  describe("GIVEN a location to record", () => {
    test("WHEN `set` is called with a valid location THEN it persists and reports success", async () => {
      // Arrange
      const repository = makeFakeRepository();
      const { result } = renderHook(() => useContinueWatching(repository));
      const location = buildLocation();

      // Act
      const recorded = await result.current.set(location);

      // Assert
      expect(recorded).toBe(true);
      expect(await repository.get()).toEqual(location);
    });

    test("WHEN `set` is called with a malformed location THEN nothing is written", async () => {
      // Arrange
      // The value object is the gate, exactly as `PlaybackPosition` is for
      // playback: a bad route triple must never reach storage.
      const repository = makeFakeRepository();
      const write = vi.spyOn(repository, "set");
      const { result } = renderHook(() => useContinueWatching(repository));

      // Act
      const recorded = await result.current.set({
        courseSlug: "a-course",
        moduleSlug: "a-module",
        lessonId: "not-a-uuid",
      });

      // Assert
      expect(recorded).toBe(false);
      expect(write).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the hook is re-rendered", () => {
    test("WHEN the repository is unchanged THEN the returned object is stable", async () => {
      // Arrange
      // Consumers list it in a `useEffect` dependency array; a new object per
      // render would re-run the effect and re-record on every paint.
      const repository = makeFakeRepository();
      const { result, rerender } = renderHook(() => useContinueWatching(repository));
      const first = result.current;

      // Act
      rerender();

      // Assert
      await waitFor(() => expect(result.current).toBe(first));
    });
  });

  describe("GIVEN no repository is injected", () => {
    test("WHEN a location is set THEN it is saved for the signed-in learner and read back", async () => {
      const location = buildLocation();
      const { result } = renderHook(() => useContinueWatching());

      await result.current.set(location);

      expect(recordContinueWatchingAction).toHaveBeenCalledWith(location);
      expect(await result.current.get()).toEqual(location);
    });
  });
});
