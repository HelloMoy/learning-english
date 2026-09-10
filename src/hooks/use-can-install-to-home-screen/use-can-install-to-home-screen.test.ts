import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useIsHydrated } from "../use-is-hydrated/use-is-hydrated";
import { useCanInstallToHomeScreen } from "./use-can-install-to-home-screen";

vi.mock("../use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: vi.fn(),
}));

const mockUseIsHydrated = vi.mocked(useIsHydrated);

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";

/** jsdom ships neither a settable userAgent nor matchMedia. */
const stubBrowser = ({
  userAgent,
  standalone = false,
}: {
  userAgent: string;
  standalone?: boolean;
}) => {
  vi.stubGlobal("navigator", { userAgent, standalone });
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: standalone,
      media: "(display-mode: standalone)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

describe("useCanInstallToHomeScreen", () => {
  beforeEach(() => {
    mockUseIsHydrated.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("GIVEN a learner who could still install the app", () => {
    test("WHEN on iPhone Safari and not yet installed THEN it can be installed", () => {
      stubBrowser({ userAgent: IPHONE_SAFARI });

      expect(renderHook(() => useCanInstallToHomeScreen()).result.current).toBe(true);
    });
  });

  describe("GIVEN a browser where this flow does not exist", () => {
    test.each([
      ["Chrome on iPhone", IPHONE_CHROME],
      ["Safari on a Mac", MAC_SAFARI],
      ["Chrome on Android", ANDROID_CHROME],
    ])("WHEN it is %s THEN it cannot", (_, userAgent) => {
      stubBrowser({ userAgent });

      expect(renderHook(() => useCanInstallToHomeScreen()).result.current).toBe(false);
    });
  });

  describe("GIVEN a learner who already did it", () => {
    test("WHEN the app is already running from the home screen THEN it cannot", () => {
      // Offering the guide here would be telling someone to do a thing they
      // have plainly already done.
      stubBrowser({ userAgent: IPHONE_SAFARI, standalone: true });

      expect(renderHook(() => useCanInstallToHomeScreen()).result.current).toBe(false);
    });
  });

  describe("GIVEN the server cannot know any of this", () => {
    test("WHEN hydration has not committed THEN it reports false", () => {
      // Anything else makes the server and client markup disagree.
      mockUseIsHydrated.mockReturnValue(false);
      stubBrowser({ userAgent: IPHONE_SAFARI });

      expect(renderHook(() => useCanInstallToHomeScreen()).result.current).toBe(false);
    });
  });
});
