import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  HOLD_ARM_DELAY_MS,
  HOLD_KEYS,
  HOLD_MOVE_TOLERANCE_PX,
  useSpeedHold,
} from "./use-speed-hold";

/** Where every press in these tests begins, so a move can be measured from it. */
const PRESS_ORIGIN = { clientX: 200, clientY: 120 };

describe("useSpeedHold", () => {
  let player: HTMLElement;
  let provider: HTMLElement;
  let controlBar: HTMLElement;
  /* One object for the whole test: the hook re-attaches when the player it is
   * given changes, exactly as the real caller's context-stable instance
   * never does. */
  let playerOwner: { el: HTMLElement | null };

  beforeEach(() => {
    vi.useFakeTimers();
    player = document.createElement("div");
    provider = document.createElement("div");
    provider.setAttribute("data-media-provider", "");
    controlBar = document.createElement("div");
    player.append(provider, controlBar);
    document.body.append(player);
    playerOwner = { el: player };
    // The gesture only takes the key while the player itself has focus; a
    // control that has it keeps the key for its own sake.
    player.tabIndex = 0;
    player.focus();
  });

  afterEach(() => {
    player.remove();
    vi.useRealTimers();
  });

  function renderSpeedHold(enabled = true, onKeyTap = () => {}) {
    return renderHook(
      (props: { enabled: boolean }) => useSpeedHold({ player: playerOwner, onKeyTap, ...props }),
      {
        initialProps: { enabled },
      },
    );
  }

  function press(target: Element = provider, overrides: Record<string, unknown> = {}) {
    fireEvent.pointerDown(target, { button: 0, ...PRESS_ORIGIN, ...overrides });
  }

  function movePressBy(distanceInPixels: number) {
    fireEvent.pointerMove(provider, {
      clientX: PRESS_ORIGIN.clientX + distanceInPixels,
      clientY: PRESS_ORIGIN.clientY,
    });
  }

  function waitForTheDelay(elapsedMs = HOLD_ARM_DELAY_MS) {
    act(() => {
      vi.advanceTimersByTime(elapsedMs);
    });
  }

  /** The frame the hold waits for before reporting a release. */
  function letTheFramePass() {
    act(() => {
      vi.advanceTimersByTime(20);
    });
  }

  function release(type: "pointerUp" | "pointerCancel" = "pointerUp") {
    act(() => {
      fireEvent[type](provider, PRESS_ORIGIN);
    });
    letTheFramePass();
  }

  describe("GIVEN nothing is pressed", () => {
    test("WHEN rendered THEN no hold is reported", () => {
      const { result } = renderSpeedHold();

      expect(result.current).toBe(false);
    });
  });

  describe("GIVEN a press on the video", () => {
    test("WHEN it has not lasted the delay THEN no hold is reported", () => {
      const { result } = renderSpeedHold();

      press();
      waitForTheDelay(HOLD_ARM_DELAY_MS - 1);

      expect(result.current).toBe(false);
    });

    test("WHEN it lasts the delay THEN a hold is reported", () => {
      const { result } = renderSpeedHold();

      press();
      waitForTheDelay();

      expect(result.current).toBe(true);
    });

    test("WHEN the finger lifts THEN the hold ends", () => {
      const { result } = renderSpeedHold();
      press();
      waitForTheDelay();

      release();

      expect(result.current).toBe(false);
    });

    test("WHEN the finger has just lifted THEN the hold is still on for that frame", () => {
      // The browser delivers a touch release as `pointerup` first and
      // `touchend` after it, and Vidstack's tap gesture listens for the
      // second one on a coarse pointer. A hold that ended between the two
      // would re-enable that gesture in time for it to read the release as a
      // tap — which is how releasing a hold used to pause the lesson on an
      // iPhone. The hold outlives the frame its release arrived in.
      const { result } = renderSpeedHold();
      press();
      waitForTheDelay();

      act(() => {
        fireEvent.pointerUp(provider, PRESS_ORIGIN);
      });

      expect(result.current).toBe(true);
    });

    test("WHEN the browser cancels the pointer THEN the hold ends", () => {
      // A pan that the browser claims for a scroll ends this way, never in a
      // `pointerup`.
      const { result } = renderSpeedHold();
      press();
      waitForTheDelay();

      release("pointerCancel");

      expect(result.current).toBe(false);
    });

    test("WHEN a second finger arrives THEN the hold ends", () => {
      const { result } = renderSpeedHold();
      press();
      waitForTheDelay();

      act(() => {
        press();
      });
      letTheFramePass();

      expect(result.current).toBe(false);
    });

    test("WHEN the finger lifts away from the player THEN the hold still ends", () => {
      // A finger that wandered off the player before lifting: the player never
      // sees that `pointerup`, and a hold left armed would never be released.
      const { result } = renderSpeedHold();
      press();
      waitForTheDelay();

      act(() => {
        fireEvent.pointerUp(document.body, PRESS_ORIGIN);
      });
      letTheFramePass();

      expect(result.current).toBe(false);
    });

    test("WHEN the finger lifts before the delay THEN no hold arms afterwards", () => {
      const { result } = renderSpeedHold();

      press();
      fireEvent.pointerUp(provider, PRESS_ORIGIN);
      waitForTheDelay();

      expect(result.current).toBe(false);
    });
  });

  describe("GIVEN a press that moves", () => {
    test("WHEN it moves past the tolerance before the delay THEN no hold arms", () => {
      // The swipe that hides the browser's toolbar travels through the player.
      const { result } = renderSpeedHold();

      press();
      movePressBy(HOLD_MOVE_TOLERANCE_PX + 1);
      waitForTheDelay();

      expect(result.current).toBe(false);
    });

    test("WHEN it stays within the tolerance THEN the hold still arms", () => {
      const { result } = renderSpeedHold();

      press();
      movePressBy(HOLD_MOVE_TOLERANCE_PX - 1);
      waitForTheDelay();

      expect(result.current).toBe(true);
    });

    test("WHEN it moves after the hold armed THEN the hold stays", () => {
      const { result } = renderSpeedHold();
      press();
      waitForTheDelay();

      act(() => {
        movePressBy(HOLD_MOVE_TOLERANCE_PX * 10);
      });

      expect(result.current).toBe(true);
    });
  });

  describe("GIVEN a press the gesture must ignore", () => {
    test("WHEN it is not the primary button THEN no hold arms", () => {
      const { result } = renderSpeedHold();

      press(provider, { button: 2 });
      waitForTheDelay();

      expect(result.current).toBe(false);
    });

    test("WHEN it begins outside the video THEN no hold arms", () => {
      // The control bar, the resume overlay and the hint's dismiss control
      // take their own pointer, exactly as they do for the tap gestures.
      const { result } = renderSpeedHold();

      press(controlBar);
      waitForTheDelay();

      expect(result.current).toBe(false);
    });
  });

  describe("GIVEN the gesture is not available", () => {
    test("WHEN a press is held THEN no hold arms", () => {
      const { result } = renderSpeedHold(false);

      press();
      waitForTheDelay();

      expect(result.current).toBe(false);
    });

    test("WHEN it becomes unavailable mid-hold THEN the hold ends", () => {
      const { result, rerender } = renderSpeedHold();
      press();
      waitForTheDelay();

      act(() => {
        rerender({ enabled: false });
      });

      expect(result.current).toBe(false);
    });
  });

  describe("GIVEN the platform would answer a long press with a menu", () => {
    test("WHEN a press is in flight THEN the context menu is prevented", () => {
      renderSpeedHold();
      press();

      const wasAllowed = fireEvent.contextMenu(provider);

      expect(wasAllowed).toBe(false);
    });

    test("WHEN no press is in flight THEN the context menu is left alone", () => {
      renderSpeedHold();

      const wasAllowed = fireEvent.contextMenu(provider);

      expect(wasAllowed).toBe(true);
    });
  });

  describe("GIVEN the play/pause key", () => {
    const HELD_KEY = HOLD_KEYS[0];

    function pressTheKey(key: string = HELD_KEY) {
      act(() => {
        fireEvent.keyDown(document, { key });
      });
    }

    function releaseTheKey() {
      act(() => {
        fireEvent.keyUp(document, { key: HELD_KEY });
      });
      letTheFramePass();
    }

    test("WHEN it is held past the delay THEN a hold is reported", () => {
      const { result } = renderSpeedHold();

      pressTheKey();
      waitForTheDelay();

      expect(result.current).toBe(true);
    });

    test("WHEN it comes up THEN the hold ends", () => {
      const { result } = renderSpeedHold();
      pressTheKey();
      waitForTheDelay();

      releaseTheKey();

      expect(result.current).toBe(false);
    });

    test("WHEN the platform repeats it THEN the one hold runs on", () => {
      // A held key repeats; read as a second press it would end the hold it
      // had just started.
      const { result } = renderSpeedHold();
      pressTheKey();
      waitForTheDelay();

      pressTheKey();
      pressTheKey();

      expect(result.current).toBe(true);
    });

    test("WHEN it comes up before the delay THEN it is reported as a tap", () => {
      // The library no longer toggles playback for this key, so the tap it
      // would have handled is handed to the caller instead.
      const taps = vi.fn();
      const { result } = renderSpeedHold(true, taps);

      pressTheKey();
      waitForTheDelay(HOLD_ARM_DELAY_MS - 1);
      releaseTheKey();

      expect(taps).toHaveBeenCalledTimes(1);
      expect(result.current).toBe(false);
    });

    test("WHEN it is held past the delay THEN no tap is reported on release", () => {
      const taps = vi.fn();
      renderSpeedHold(true, taps);

      pressTheKey();
      waitForTheDelay();
      releaseTheKey();

      expect(taps).not.toHaveBeenCalled();
    });

    test("WHEN the gesture is not available THEN the key arms nothing", () => {
      const taps = vi.fn();
      const { result } = renderSpeedHold(false, taps);

      pressTheKey();
      waitForTheDelay();

      expect(result.current).toBe(false);
      expect(taps).not.toHaveBeenCalled();
    });

    test("WHEN it is held THEN the key's own action never runs", () => {
      // The library acts on this key's keydown, and would pause the lesson
      // half a second before the hold could arm.
      renderSpeedHold();

      const wasAllowed = fireEvent.keyDown(document, { key: HELD_KEY });

      expect(wasAllowed).toBe(false);
    });

    test("WHEN the platform repeats it THEN the repeat is cancelled too", () => {
      // A repeat left alone would reach the library, which would toggle
      // playback under the hold.
      renderSpeedHold();
      pressTheKey();

      const wasAllowed = fireEvent.keyDown(document, { key: HELD_KEY, repeat: true });

      expect(wasAllowed).toBe(false);
    });

    test("WHEN a modifier is held with it THEN the key is left alone", () => {
      const { result } = renderSpeedHold();

      const wasAllowed = fireEvent.keyDown(document, { key: HELD_KEY, metaKey: true });
      waitForTheDelay();

      expect(wasAllowed).toBe(true);
      expect(result.current).toBe(false);
    });

    test("WHEN another key is pressed THEN it is left alone", () => {
      const { result } = renderSpeedHold();

      const wasAllowed = fireEvent.keyDown(document, { key: "f" });
      waitForTheDelay();

      expect(wasAllowed).toBe(true);
      expect(result.current).toBe(false);
    });

    test("WHEN a control in the player has focus THEN it keeps the key", () => {
      // Space activates a focused button; the gesture must not take that.
      const taps = vi.fn();
      const { result } = renderSpeedHold(true, taps);
      const button = document.createElement("button");
      player.append(button);
      button.focus();

      const wasAllowed = fireEvent.keyDown(document, { key: HELD_KEY });
      waitForTheDelay();

      expect(wasAllowed).toBe(true);
      expect(result.current).toBe(false);
      expect(taps).not.toHaveBeenCalled();
    });

    test("WHEN focus is outside the player THEN the key is left alone", () => {
      const { result } = renderSpeedHold();
      const elsewhere = document.createElement("input");
      document.body.append(elsewhere);
      elsewhere.focus();

      const wasAllowed = fireEvent.keyDown(document, { key: HELD_KEY });
      waitForTheDelay();

      expect(wasAllowed).toBe(true);
      expect(result.current).toBe(false);
      elsewhere.remove();
    });

    test("WHEN a finger is already pressing THEN the key is ignored", () => {
      const { result } = renderSpeedHold();
      press();

      pressTheKey();
      waitForTheDelay();

      expect(result.current).toBe(true);
    });

    test("WHEN a finger lifts during a key hold THEN the key still owns the hold", () => {
      const { result } = renderSpeedHold();
      pressTheKey();
      waitForTheDelay();

      act(() => {
        fireEvent.pointerUp(provider, PRESS_ORIGIN);
      });
      letTheFramePass();

      expect(result.current).toBe(true);
    });
  });

  describe("GIVEN the hook is torn down", () => {
    /* Counted as a difference, not against zero: focusing the player leaves a
     * timer of jsdom's own behind, and it is none of this hook's business. */
    test("WHEN it unmounts mid-press THEN no timer is left to fire", () => {
      const { unmount } = renderSpeedHold();
      const timersBeforeThePress = vi.getTimerCount();
      press();
      expect(vi.getTimerCount()).toBeGreaterThan(timersBeforeThePress);

      unmount();

      expect(vi.getTimerCount()).toBe(timersBeforeThePress);
    });

    test("WHEN it has unmounted THEN a press on the player is no longer heard", () => {
      const { unmount } = renderSpeedHold();
      unmount();
      const timersBeforeThePress = vi.getTimerCount();

      press();

      expect(vi.getTimerCount()).toBe(timersBeforeThePress);
    });
  });

  describe("GIVEN no player element", () => {
    test("WHEN rendered THEN nothing is listened to and no hold is reported", () => {
      const { result } = renderHook(() => useSpeedHold({ player: null, enabled: true }));

      press();
      waitForTheDelay();

      expect(result.current).toBe(false);
    });
  });
});
