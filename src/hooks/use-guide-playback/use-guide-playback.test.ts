import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { STEP_INTERVAL_MS, useGuidePlayback } from "./use-guide-playback";

const FRAMES = 5;

/** jsdom answers every media query as unmatched, which is "motion is fine". */
const stubReducedMotion = (prefersReduced: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: prefersReduced,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

const advanceOneInterval = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_INTERVAL_MS);
  });
};

/**
 * The hook hands these to a DOM node. Driving them directly is what lets the
 * gesture be tested without a component to hang them on.
 */
const dragBy = (
  handlers: ReturnType<typeof useGuidePlayback>["swipeHandlers"],
  travelX: number,
) => {
  act(() => {
    handlers.onPointerDown({ clientX: 0, clientY: 0 } as React.PointerEvent);
    handlers.onPointerUp({ clientX: travelX, clientY: 0 } as React.PointerEvent);
  });
};

describe("useGuidePlayback", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("GIVEN a guide that plays itself", () => {
    test("WHEN first rendered THEN it opens on the first frame", () => {
      expect(renderHook(() => useGuidePlayback(FRAMES)).result.current.frameIndex).toBe(0);
    });

    test("WHEN the interval elapses THEN it advances one frame", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      await advanceOneInterval();

      expect(result.current.frameIndex).toBe(1);
    });

    test("WHEN the last frame has played THEN it returns to the first", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      for (let frame = 0; frame < FRAMES; frame += 1) await advanceOneInterval();

      expect(result.current.frameIndex).toBe(0);
    });

    test("WHEN unmounted THEN it leaves no timer running", () => {
      vi.useFakeTimers();
      const { unmount } = renderHook(() => useGuidePlayback(FRAMES));

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("GIVEN a viewer who asked for less motion", () => {
    test("WHEN the interval elapses THEN it holds the frame it opened on", async () => {
      // The preference silences movement the viewer did not ask for.
      stubReducedMotion(true);
      vi.useFakeTimers();
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      await advanceOneInterval();

      expect(result.current.frameIndex).toBe(0);
    });

    test("WHEN they drag THEN the guide still moves", () => {
      // The gesture is the motion they did ask for, and without it every frame
      // but the first would be unreachable here.
      stubReducedMotion(true);
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      dragBy(result.current.swipeHandlers, -80);

      expect(result.current.frameIndex).toBe(1);
    });
  });

  describe("GIVEN a learner using the guide's own controls", () => {
    test("WHEN they ask for the next frame THEN it is shown", () => {
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      act(() => result.current.showNext());

      expect(result.current.frameIndex).toBe(1);
    });

    test("WHEN they ask for the previous from the first THEN the last is shown", () => {
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      act(() => result.current.showPrevious());

      expect(result.current.frameIndex).toBe(FRAMES - 1);
    });

    test("WHEN they pick a frame THEN the guide goes straight to it", () => {
      // A learner who watched two frames go by wants the one they missed, not
      // one step back from wherever the loop has reached.
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      act(() => result.current.showFrame(3));

      expect(result.current.frameIndex).toBe(3);
    });

    test("WHEN they pick a frame THEN it gets a full interval before the guide moves", async () => {
      // Same promise the gesture already gets: the frame you chose is not taken
      // away by whatever was left of the tick you interrupted.
      vi.useFakeTimers();
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_INTERVAL_MS - 200);
      });
      act(() => result.current.showFrame(3));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.frameIndex).toBe(3);
    });
  });

  describe("GIVEN the countdown describes a timer that may not be running", () => {
    test("WHEN motion is fine THEN the guide reports that it is playing", () => {
      expect(renderHook(() => useGuidePlayback(FRAMES)).result.current.isPlaying).toBe(true);
    });

    test("WHEN the viewer prefers reduced motion THEN it reports that it is not", () => {
      // The countdown reads this. Showing one where no timer runs would be a
      // countdown that never counts.
      stubReducedMotion(true);

      expect(renderHook(() => useGuidePlayback(FRAMES)).result.current.isPlaying).toBe(false);
    });
  });

  describe("GIVEN a learner moving it by hand", () => {
    test("WHEN they drag towards the left THEN the next frame is shown", () => {
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      dragBy(result.current.swipeHandlers, -80);

      expect(result.current.frameIndex).toBe(1);
    });

    test("WHEN they drag back towards the right THEN the previous frame returns", () => {
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      dragBy(result.current.swipeHandlers, -80);
      dragBy(result.current.swipeHandlers, 80);

      expect(result.current.frameIndex).toBe(0);
    });

    test("WHEN they drag back from the first frame THEN the last is shown", () => {
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      dragBy(result.current.swipeHandlers, 80);

      expect(result.current.frameIndex).toBe(FRAMES - 1);
    });

    test("WHEN they move it by hand THEN the frame they chose gets a full interval", async () => {
      // Taking a frame away early punishes the learner for the moment their
      // gesture happened to land in.
      vi.useFakeTimers();
      const { result } = renderHook(() => useGuidePlayback(FRAMES));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_INTERVAL_MS - 200);
      });
      dragBy(result.current.swipeHandlers, -80);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.frameIndex).toBe(1);
    });
  });
});
