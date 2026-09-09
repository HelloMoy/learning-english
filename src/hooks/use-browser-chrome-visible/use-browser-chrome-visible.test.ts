import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useBrowserChromeVisible } from "./use-browser-chrome-visible";

/**
 * An iPhone held in landscape, as iOS reports it: `screen` stays in portrait
 * terms whatever the orientation, and `innerHeight` follows Safari's toolbar —
 * 292 of the 402 points with it on screen, all 402 once it is hidden.
 */
const IPHONE_LANDSCAPE = {
  coarsePointer: true,
  landscape: true,
  screen: { width: 402, height: 874 },
  innerHeight: 292,
};

function browserReports({
  coarsePointer,
  landscape,
  screen,
  innerHeight,
}: {
  coarsePointer: boolean;
  landscape: boolean;
  screen: { width: number; height: number };
  innerHeight: number;
}): void {
  const answers: Record<string, boolean> = {
    "(pointer: coarse)": coarsePointer,
    "(orientation: landscape)": landscape,
  };
  window.matchMedia = vi
    .fn()
    .mockImplementation(
      (query: string) => ({ matches: answers[query] ?? false }) as MediaQueryList,
    );
  Object.defineProperty(window.screen, "width", { configurable: true, value: screen.width });
  Object.defineProperty(window.screen, "height", { configurable: true, value: screen.height });
  window.innerHeight = innerHeight;
}

describe("useBrowserChromeVisible", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    browserReports(IPHONE_LANDSCAPE);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe("GIVEN a touch device held in landscape", () => {
    test("WHEN the viewport is shorter than the screen's short side THEN the browser chrome is on screen", () => {
      const { result } = renderHook(() => useBrowserChromeVisible());

      expect(result.current).toBe(true);
    });

    test("WHEN the viewport reaches the screen's short side THEN the browser chrome is gone", () => {
      browserReports({ ...IPHONE_LANDSCAPE, innerHeight: 402 });

      const { result } = renderHook(() => useBrowserChromeVisible());

      expect(result.current).toBe(false);
    });

    test("WHEN the screen is reported in landscape terms THEN the short side is still the yardstick", () => {
      // Engines other than iOS swap `screen` with the orientation.
      browserReports({ ...IPHONE_LANDSCAPE, screen: { width: 874, height: 402 } });

      const { result } = renderHook(() => useBrowserChromeVisible());

      expect(result.current).toBe(true);
    });

    test("WHEN the viewport grows after a resize THEN the answer follows it", () => {
      const { result } = renderHook(() => useBrowserChromeVisible());

      window.innerHeight = 402;
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current).toBe(false);
    });
  });

  describe("GIVEN a device where a swipe means nothing", () => {
    test("WHEN the primary pointer is not a finger THEN no chrome is reported even with a short viewport", () => {
      browserReports({ ...IPHONE_LANDSCAPE, coarsePointer: false });

      const { result } = renderHook(() => useBrowserChromeVisible());

      expect(result.current).toBe(false);
    });

    test("WHEN the device is in portrait THEN no chrome is reported even with a short viewport", () => {
      browserReports({ ...IPHONE_LANDSCAPE, landscape: false, innerHeight: 714 });

      const { result } = renderHook(() => useBrowserChromeVisible());

      expect(result.current).toBe(false);
    });
  });

  describe("GIVEN the page is rendered on the server", () => {
    test("WHEN there is no viewport to measure THEN no chrome is reported", () => {
      function Probe() {
        return createElement("span", null, String(useBrowserChromeVisible()));
      }

      const html = renderToString(createElement(Probe));

      expect(html).toContain("false");
    });
  });
});
