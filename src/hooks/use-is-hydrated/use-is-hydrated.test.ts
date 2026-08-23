import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useIsHydrated } from "./use-is-hydrated";

describe("useIsHydrated", () => {
  describe("GIVEN a client-only render (no server HTML to hydrate)", () => {
    test("WHEN the hook runs THEN it reports hydrated straight away", () => {
      // Arrange + Act — `render` (as opposed to `hydrateRoot`) never goes
      // through the hydration path, so React reads `getSnapshot` directly.
      const { result } = renderHook(() => useIsHydrated());

      // Assert
      expect(result.current).toBe(true);
    });
  });

  describe("GIVEN the hook stays mounted", () => {
    test("WHEN the subscription's nudge fires THEN the value stays hydrated", async () => {
      // Arrange
      const { result } = renderHook(() => useIsHydrated());

      // Act — let the `setTimeout(0)` re-render nudge run.
      // Assert — it must not flip back to `false`.
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe("GIVEN the hook unmounts before its nudge fires", () => {
    test("WHEN unmounted THEN the pending timeout is cleared without throwing", () => {
      // Arrange
      const { unmount } = renderHook(() => useIsHydrated());

      // Act + Assert — an uncleared timeout would call into an unmounted
      // store subscription.
      expect(() => unmount()).not.toThrow();
    });
  });
});
