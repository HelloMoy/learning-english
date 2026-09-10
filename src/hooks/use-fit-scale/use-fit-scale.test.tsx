import "@testing-library/jest-dom/vitest";

import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useFitScale } from "./use-fit-scale";

const NATURAL_HEIGHT = 598;

/**
 * jsdom ships no ResizeObserver. This stub keeps the callback so a test can
 * fire it, which is how the hook learns about a resize.
 */
const stubResizeObserver = () => {
  const callbacks: (() => void)[] = [];

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );

  return () => act(() => callbacks.forEach((callback) => callback()));
};

/** Every element measures 0 in jsdom, so the measured height is stubbed too. */
const stubMeasuredHeight = (height: number) =>
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(height);

/** Attaches the ref the way a real component does: during the commit. */
function Probe({ naturalHeight = NATURAL_HEIGHT }: { naturalHeight?: number }) {
  const { ref, scale } = useFitScale(naturalHeight);

  return (
    <div
      ref={ref}
      data-testid="box"
      data-scale={scale}
    />
  );
}

const scaleOf = () => Number(screen.getByTestId("box").dataset.scale);

describe("useFitScale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("GIVEN content that must fit the room it is given", () => {
    test("WHEN the box has not been laid out yet THEN it stays at natural size", () => {
      // Shrinking to nothing on the first paint would make the content vanish.
      stubResizeObserver();
      stubMeasuredHeight(0);

      render(<Probe />);

      expect(scaleOf()).toBe(1);
    });

    test("WHEN the room is smaller THEN it shrinks to the ratio", () => {
      stubResizeObserver();
      stubMeasuredHeight(NATURAL_HEIGHT / 2);

      render(<Probe />);

      expect(scaleOf()).toBeCloseTo(0.5);
    });

    test("WHEN the room is larger THEN it is not enlarged", () => {
      // Scaling a mock drawn at fixed pixel sizes past 1 only blurs it.
      stubResizeObserver();
      stubMeasuredHeight(NATURAL_HEIGHT * 2);

      render(<Probe />);

      expect(scaleOf()).toBe(1);
    });

    test("WHEN the box is resized THEN the scale follows it", () => {
      const fireResize = stubResizeObserver();
      const measured = stubMeasuredHeight(NATURAL_HEIGHT);
      render(<Probe />);

      measured.mockReturnValue(NATURAL_HEIGHT / 4);
      fireResize();

      expect(scaleOf()).toBeCloseTo(0.25);
    });

    test("WHEN the natural height is zero THEN it does not divide by it", () => {
      stubResizeObserver();
      stubMeasuredHeight(300);

      render(<Probe naturalHeight={0} />);

      expect(Number.isFinite(scaleOf())).toBe(true);
    });
  });
});
