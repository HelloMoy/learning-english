import { afterEach, describe, expect, test, vi } from "vitest";

import { isRunningStandalone } from "./is-running-standalone";

/** jsdom answers every media query as unmatched, which is a browser tab. */
const stubDisplayMode = (matches: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(display-mode: standalone)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

describe("isRunningStandalone", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("GIVEN the app was launched from the home screen", () => {
    test("WHEN the display mode says standalone THEN it reports standalone", () => {
      stubDisplayMode(true);

      expect(isRunningStandalone()).toBe(true);
    });

    test("WHEN only Safari's own flag says so THEN it reports standalone", () => {
      // `navigator.standalone` predates the media query and is still the
      // reliable signal on iOS, so it is consulted even when the query says no.
      stubDisplayMode(false);
      vi.stubGlobal("navigator", { standalone: true });

      expect(isRunningStandalone()).toBe(true);
    });
  });

  describe("GIVEN the app is running in a browser tab", () => {
    test("WHEN neither signal is set THEN it reports not standalone", () => {
      stubDisplayMode(false);

      expect(isRunningStandalone()).toBe(false);
    });
  });
});
