import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useIsLearnerStoreSeeded } from "./use-is-learner-store-seeded";

describe("useIsLearnerStoreSeeded", () => {
  describe("GIVEN the learner store has not been seeded", () => {
    test("WHEN the hook runs THEN it reports not seeded", () => {
      // Arrange
      resetLearnerStore();

      // Act
      const { result } = renderHook(() => useIsLearnerStoreSeeded());

      // Assert
      expect(result.current).toBe(false);
    });

    test("WHEN the store is seeded while mounted THEN it reports seeded", () => {
      // Arrange
      resetLearnerStore();
      const { result } = renderHook(() => useIsLearnerStoreSeeded());

      // Act
      act(() => givenLearner.enrolledCourses([]));

      // Assert
      expect(result.current).toBe(true);
    });
  });
});
