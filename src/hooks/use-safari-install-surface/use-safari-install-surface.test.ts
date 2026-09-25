import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useCanInstallToHomeScreen } from "../use-can-install-to-home-screen/use-can-install-to-home-screen";
import { useIsHydrated } from "../use-is-hydrated/use-is-hydrated";
import { useSafariInstallSurface } from "./use-safari-install-surface";

vi.mock("../use-is-hydrated/use-is-hydrated", () => ({ useIsHydrated: vi.fn() }));
vi.mock("../use-can-install-to-home-screen/use-can-install-to-home-screen", () => ({
  useCanInstallToHomeScreen: vi.fn(),
}));

const mockUseIsHydrated = vi.mocked(useIsHydrated);
const mockUseCanInstallToHomeScreen = vi.mocked(useCanInstallToHomeScreen);

/**
 * Captured from the iPadOS 26.5 simulator. There is no iPad token in it: Safari
 * on an iPad claims, byte for byte, to be Safari on a Mac.
 */
const APPLE_DESKTOP_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const MAC_EDGE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0";
const MAC_FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0";
const IPAD_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1";

/** jsdom ships neither a settable userAgent, nor maxTouchPoints, nor matchMedia. */
const stubBrowser = ({
  userAgent,
  maxTouchPoints = 0,
  standalone = false,
}: {
  userAgent: string;
  maxTouchPoints?: number;
  standalone?: boolean;
}) => {
  vi.stubGlobal("navigator", { userAgent, maxTouchPoints, standalone });
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

describe("useSafariInstallSurface", () => {
  beforeEach(() => {
    mockUseIsHydrated.mockReturnValue(true);
    mockUseCanInstallToHomeScreen.mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("GIVEN an iPad, which claims to be a Mac", () => {
    test("WHEN it reports a touch screen THEN it is recognised as an iPad", () => {
      // The user agent cannot tell these apart. `maxTouchPoints` can: verified
      // at 5 on iPadOS 26.5 and 0 on macOS 26.6.
      stubBrowser({ userAgent: APPLE_DESKTOP_SAFARI, maxTouchPoints: 5 });

      expect(renderHook(() => useSafariInstallSurface()).result.current).toBe("ipad");
    });
  });

  describe("GIVEN a Mac", () => {
    test("WHEN it reports no touch screen THEN it is recognised as a Mac", () => {
      stubBrowser({ userAgent: APPLE_DESKTOP_SAFARI, maxTouchPoints: 0 });

      expect(renderHook(() => useSafariInstallSurface()).result.current).toBe("mac");
    });
  });

  describe("GIVEN an iPhone", () => {
    test("WHEN Safari can still install THEN it is recognised as an iPhone", () => {
      mockUseCanInstallToHomeScreen.mockReturnValue(true);
      stubBrowser({ userAgent: "irrelevant, the iPhone question is answered elsewhere" });

      expect(renderHook(() => useSafariInstallSurface()).result.current).toBe("iphone");
    });
  });

  describe("GIVEN a browser only pretending to be Safari", () => {
    test.each([
      ["Chrome on a Mac", MAC_CHROME, 0],
      ["Edge on a Mac", MAC_EDGE, 0],
      ["Firefox on a Mac", MAC_FIREFOX, 0],
      ["Chrome on an iPad", IPAD_CHROME, 5],
    ])("WHEN it is %s THEN no Safari flow is offered", (_name, userAgent, maxTouchPoints) => {
      // Every Chromium and Gecko browser puts "Safari" in its user agent, and
      // none of them carries either flow.
      stubBrowser({ userAgent, maxTouchPoints });

      expect(renderHook(() => useSafariInstallSurface()).result.current).toBe("none");
    });
  });

  describe("GIVEN the app is already installed", () => {
    test("WHEN running standalone THEN no flow is offered", () => {
      stubBrowser({ userAgent: APPLE_DESKTOP_SAFARI, maxTouchPoints: 5, standalone: true });

      expect(renderHook(() => useSafariInstallSurface()).result.current).toBe("none");
    });
  });

  describe("GIVEN the page has not finished hydrating", () => {
    test("WHEN rendered THEN nothing is reported yet", () => {
      // Server and client markup have to agree; all of this is a browser fact.
      mockUseIsHydrated.mockReturnValue(false);
      stubBrowser({ userAgent: APPLE_DESKTOP_SAFARI, maxTouchPoints: 5 });

      expect(renderHook(() => useSafariInstallSurface()).result.current).toBe("none");
    });
  });
});
