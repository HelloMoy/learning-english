import {
  SEEK_RUN_WINDOW_MS,
  SEEK_STEP_OPTIONS_SECONDS,
  type SeekStepSeconds,
} from "@/lib/seek-run/seek-run";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useSeekRun } from "./use-seek-run";

function anchorInsideALesson(): number {
  return faker.number.float({ min: 120, max: 3600, fractionDigits: 2 });
}

/** Any of the offered steps, for cases the exact size does not decide. */
function anOfferedStep(): SeekStepSeconds {
  return faker.helpers.arrayElement(SEEK_STEP_OPTIONS_SECONDS);
}

/** An offered step other than this one, for cases that need two of them. */
function anotherOfferedStep(step: SeekStepSeconds): SeekStepSeconds {
  return faker.helpers.arrayElement(SEEK_STEP_OPTIONS_SECONDS.filter((each) => each !== step));
}

describe("useSeekRun", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GIVEN no run is active", () => {
    test("WHEN rendered THEN there is no run", () => {
      const { result } = renderHook(() => useSeekRun());

      expect(result.current.run).toBeNull();
    });

    test("WHEN an edge is tapped THEN a one-step run starts there and the target is returned", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const { result } = renderHook(() => useSeekRun());

      let target = 0;
      act(() => {
        target = result.current.tap("forward", anchorTime, stepSeconds);
      });

      expect(result.current.run).toEqual({
        direction: "forward",
        steps: 1,
        anchorTime,
        stepSeconds,
      });
      expect(target).toBeCloseTo(anchorTime + stepSeconds);
    });
  });

  describe("GIVEN a run is active", () => {
    test("WHEN the same edge is tapped THEN the run gains a step counted from the anchor", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("backward", anchorTime, stepSeconds);
      });

      let target = 0;
      act(() => {
        // The anchor is what counts: whatever the player reports now is ignored.
        target = result.current.tap("backward", anchorTime - 3, stepSeconds);
      });

      expect(result.current.run?.steps).toBe(2);
      expect(target).toBeCloseTo(anchorTime - 2 * stepSeconds);
    });

    test("WHEN the step changes mid-run THEN the same edge keeps counting in the run's own step", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorTime, stepSeconds);
      });

      let target = 0;
      act(() => {
        target = result.current.tap("forward", anchorTime, anotherOfferedStep(stepSeconds));
      });

      expect(result.current.run?.stepSeconds).toBe(stepSeconds);
      expect(target).toBeCloseTo(anchorTime + 2 * stepSeconds);
    });

    test("WHEN the other edge is tapped THEN the run turns around from where it was heading", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorTime, stepSeconds);
      });

      act(() => {
        result.current.tap("backward", anchorTime, stepSeconds);
      });

      expect(result.current.run).toEqual({
        direction: "backward",
        steps: 1,
        anchorTime: anchorTime + stepSeconds,
        stepSeconds,
      });
    });

    test("WHEN it turns around after the step changed THEN the new run takes the new step", () => {
      const anchorTime = anchorInsideALesson();
      const stepSeconds = anOfferedStep();
      const chosen = anotherOfferedStep(stepSeconds);
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorTime, stepSeconds);
      });

      act(() => {
        result.current.tap("backward", anchorTime, chosen);
      });

      expect(result.current.run?.stepSeconds).toBe(chosen);
    });

    test("WHEN the window elapses THEN the run ends", () => {
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorInsideALesson(), anOfferedStep());
      });

      act(() => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS);
      });

      expect(result.current.run).toBeNull();
    });

    test("WHEN the window has not elapsed THEN the run is still on", () => {
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorInsideALesson(), anOfferedStep());
      });

      act(() => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS - 1);
      });

      expect(result.current.run).not.toBeNull();
    });

    test("WHEN a tap lands late in the window THEN the window restarts from that tap", () => {
      const stepSeconds = anOfferedStep();
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorInsideALesson(), stepSeconds);
      });
      act(() => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS - 1);
      });

      act(() => {
        result.current.tap("forward", anchorInsideALesson(), stepSeconds);
      });
      act(() => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS - 1);
      });

      expect(result.current.run?.steps).toBe(2);
    });

    test("WHEN a run ends THEN the next tap starts a fresh one", () => {
      const firstAnchor = anchorInsideALesson();
      const secondAnchor = firstAnchor + 42;
      const stepSeconds = anOfferedStep();
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", firstAnchor, stepSeconds);
      });
      act(() => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS);
      });

      act(() => {
        result.current.tap("forward", secondAnchor, stepSeconds);
      });

      expect(result.current.run).toEqual({
        direction: "forward",
        steps: 1,
        anchorTime: secondAnchor,
        stepSeconds,
      });
    });

    test("WHEN a run ends THEN the next one takes the step chosen since", () => {
      const stepSeconds = anOfferedStep();
      const chosen = anotherOfferedStep(stepSeconds);
      const { result } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorInsideALesson(), stepSeconds);
      });
      act(() => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS);
      });

      act(() => {
        result.current.tap("forward", anchorInsideALesson(), chosen);
      });

      expect(result.current.run?.stepSeconds).toBe(chosen);
    });

    test("WHEN the hook unmounts THEN no timer is left to fire", () => {
      const { result, unmount } = renderHook(() => useSeekRun());
      act(() => {
        result.current.tap("forward", anchorInsideALesson(), anOfferedStep());
      });

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
