import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SWIPE_THRESHOLD_PX, useHorizontalSwipe } from "./use-horizontal-swipe";

/** Far enough past the threshold that the gesture is unmistakable. */
const generousTravel = () => SWIPE_THRESHOLD_PX + faker.number.int({ min: 1, max: 200 });

const renderSwipe = () => {
  const onSwipeLeft = vi.fn();
  const onSwipeRight = vi.fn();
  const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight }));

  return { handlers: result, onSwipeLeft, onSwipeRight };
};

describe("useHorizontalSwipe", () => {
  describe("GIVEN a finger travelling across the element", () => {
    test("WHEN it ends to the left of where it started THEN the left callback runs", () => {
      const { handlers, onSwipeLeft, onSwipeRight } = renderSwipe();
      const start = faker.number.int({ min: 300, max: 600 });

      act(() => {
        handlers.current.onPointerDown({ clientX: start, clientY: 0 });
        handlers.current.onPointerUp({ clientX: start - generousTravel(), clientY: 0 });
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    test("WHEN it ends to the right of where it started THEN the right callback runs", () => {
      const { handlers, onSwipeLeft, onSwipeRight } = renderSwipe();
      const start = faker.number.int({ min: 0, max: 300 });

      act(() => {
        handlers.current.onPointerDown({ clientX: start, clientY: 0 });
        handlers.current.onPointerUp({ clientX: start + generousTravel(), clientY: 0 });
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a movement that is not a swipe", () => {
    test("WHEN it falls short of the threshold THEN neither callback runs", () => {
      // A tap wanders a few pixels under the thumb; that is not a request to
      // move anything.
      const { handlers, onSwipeLeft, onSwipeRight } = renderSwipe();

      act(() => {
        handlers.current.onPointerDown({ clientX: 200, clientY: 0 });
        handlers.current.onPointerUp({ clientX: 200 - (SWIPE_THRESHOLD_PX - 1), clientY: 0 });
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    test("WHEN it travels further down than sideways THEN neither callback runs", () => {
      // The element sits on a page that scrolls, and a gesture meant for the
      // page must not be read as a swipe however far sideways it drifts.
      const { handlers, onSwipeLeft, onSwipeRight } = renderSwipe();
      const sideways = generousTravel();

      act(() => {
        handlers.current.onPointerDown({ clientX: 500, clientY: 0 });
        handlers.current.onPointerUp({ clientX: 500 - sideways, clientY: sideways + 1 });
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    test("WHEN the pointer is released without having been pressed THEN nothing runs", () => {
      const { handlers, onSwipeLeft, onSwipeRight } = renderSwipe();

      act(() => {
        handlers.current.onPointerUp({ clientX: 0, clientY: 0 });
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the browser takes the gesture away", () => {
    test("WHEN it is cancelled THEN the release that follows moves nothing", () => {
      // Without discarding the start, a cancelled gesture leaves a coordinate
      // behind that the next stray release would be measured against.
      const { handlers, onSwipeLeft, onSwipeRight } = renderSwipe();

      act(() => {
        handlers.current.onPointerDown({ clientX: 500, clientY: 0 });
        handlers.current.onPointerCancel();
        handlers.current.onPointerUp({ clientX: 500 - generousTravel(), clientY: 0 });
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN one press and one release make one gesture", () => {
    test("WHEN the pointer is released twice THEN only the first is a swipe", () => {
      const { handlers, onSwipeLeft } = renderSwipe();

      act(() => {
        handlers.current.onPointerDown({ clientX: 500, clientY: 0 });
        handlers.current.onPointerUp({ clientX: 500 - generousTravel(), clientY: 0 });
        handlers.current.onPointerUp({ clientX: 500 - generousTravel(), clientY: 0 });
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });
});
