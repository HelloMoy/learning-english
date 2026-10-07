import type { SeekDirection } from "@/lib/seek-run/seek-run";

import { faker } from "@faker-js/faker";
import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from "vitest";

import { SEEK_KEYS, useSeekKeys } from "./use-seek-keys";

type SeekReport = (direction: SeekDirection, trigger: KeyboardEvent) => void;

/** Any seek key will do where the test is not about which one. */
function aSeekKey(): string {
  return faker.helpers.arrayElement([...SEEK_KEYS.backward, ...SEEK_KEYS.forward]);
}

describe("useSeekKeys", () => {
  let player: HTMLElement;
  /* One object for the whole test: the hook re-attaches when the player it is
   * given changes, exactly as the real caller's context-stable instance
   * never does. */
  let playerOwner: { el: HTMLElement | null };
  let seeks: Mock<SeekReport>;

  beforeEach(() => {
    player = document.createElement("div");
    document.body.append(player);
    playerOwner = { el: player };
    // The keys are the player's only while focus is inside it.
    player.tabIndex = 0;
    player.focus();
    seeks = vi.fn<SeekReport>();
  });

  afterEach(() => {
    player.remove();
  });

  function renderSeekKeys(enabled = true) {
    return renderHook(() => useSeekKeys({ player: playerOwner, enabled, onSeek: seeks }));
  }

  /** A child of the player that takes keyboard focus, as a control of its chrome does. */
  function focusA(tagName: string, attributes: Record<string, string> = {}) {
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    element.tabIndex = 0;
    player.append(element);
    element.focus();
  }

  /**
   * Dispatched where a real key lands — on the focused element — so the event
   * travels down through the document and back, past every listener between.
   * Returns whether the key was left its default action.
   */
  function press(key: string, modifiers: Record<string, boolean> = {}): boolean {
    return fireEvent.keyDown(document.activeElement ?? document.body, { key, ...modifiers });
  }

  function release(key: string): boolean {
    return fireEvent.keyUp(document.activeElement ?? document.body, { key });
  }

  describe("GIVEN the player has keyboard focus", () => {
    test.each(SEEK_KEYS.forward)("WHEN %s is pressed THEN a step forward is reported", (key) => {
      renderSeekKeys();

      press(key);

      expect(seeks).toHaveBeenCalledTimes(1);
      expect(seeks).toHaveBeenCalledWith("forward", expect.any(KeyboardEvent));
    });

    test.each(SEEK_KEYS.backward)("WHEN %s is pressed THEN a step backward is reported", (key) => {
      renderSeekKeys();

      press(key);

      expect(seeks).toHaveBeenCalledTimes(1);
      expect(seeks).toHaveBeenCalledWith("backward", expect.any(KeyboardEvent));
    });

    test("WHEN the platform repeats the key THEN every repeat is another step", () => {
      const key = aSeekKey();
      renderSeekKeys();
      press(key);

      press(key, { repeat: true });
      press(key, { repeat: true });

      expect(seeks).toHaveBeenCalledTimes(3);
    });

    test("WHEN a seek key goes down THEN its own action never runs", () => {
      // An arrow left alone scrolls the page under the player.
      renderSeekKeys();

      const wasAllowed = press(aSeekKey());

      expect(wasAllowed).toBe(false);
    });

    test("WHEN a seek key goes down THEN the player's own listener never hears it", () => {
      // The library listens there, and would seek by its own step and draw
      // its own display.
      const heardByThePlayer = vi.fn();
      player.addEventListener("keydown", heardByThePlayer);
      renderSeekKeys();

      press(aSeekKey());

      expect(heardByThePlayer).not.toHaveBeenCalled();
    });

    test("WHEN a seek key comes up THEN the player's own listener never hears that either", () => {
      // The library commits its seek on keyup; handed one it saw no keydown
      // for, it seeks to nowhere.
      const heardByThePlayer = vi.fn();
      player.addEventListener("keyup", heardByThePlayer);
      const key = aSeekKey();
      renderSeekKeys();
      press(key);

      release(key);

      expect(heardByThePlayer).not.toHaveBeenCalled();
    });

    test("WHEN a seek key comes up THEN no second step is reported", () => {
      const key = aSeekKey();
      renderSeekKeys();
      press(key);

      release(key);

      expect(seeks).toHaveBeenCalledTimes(1);
    });

    test("WHEN Shift is held with it THEN the key is still a seek key", () => {
      // The letter keys arrive with it.
      renderSeekKeys();

      press(aSeekKey(), { shiftKey: true });

      expect(seeks).toHaveBeenCalledTimes(1);
    });

    test.each(["metaKey", "ctrlKey", "altKey"])(
      "WHEN %s is held with it THEN the key is left to the browser",
      (modifier) => {
        renderSeekKeys();

        const wasAllowed = press(aSeekKey(), { [modifier]: true });

        expect(wasAllowed).toBe(true);
        expect(seeks).not.toHaveBeenCalled();
      },
    );

    test("WHEN another key is pressed THEN it is left alone", () => {
      renderSeekKeys();

      const wasAllowed = press("ArrowUp");

      expect(wasAllowed).toBe(true);
      expect(seeks).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN focus is on something inside the player", () => {
    test.each([
      ["a text field", "input", {}],
      ["a menu item", "div", { role: "menuitemradio" }],
      ["the volume slider", "div", { role: "slider" }],
    ])("WHEN %s has focus THEN it keeps the key", (_name, tagName, attributes) => {
      renderSeekKeys();
      focusA(tagName, attributes);

      const wasAllowed = press(aSeekKey());

      expect(wasAllowed).toBe(true);
      expect(seeks).not.toHaveBeenCalled();
    });

    test("WHEN a button has focus THEN the key is still a seek key", () => {
      // After a click on play that is where focus is, and an arrow means
      // nothing to a button.
      renderSeekKeys();
      focusA("button");

      press(aSeekKey());

      expect(seeks).toHaveBeenCalledTimes(1);
    });

    test("WHEN the time slider has focus THEN the key is still a seek key", () => {
      // A click on the timeline leaves focus there, and its own arrows move
      // by the layout's step, not the learner's.
      renderSeekKeys();
      focusA("div", { role: "slider", "data-media-time-slider": "" });

      press(aSeekKey());

      expect(seeks).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN focus is outside the player", () => {
    test("WHEN a seek key is pressed THEN it is left alone", () => {
      renderSeekKeys();
      player.blur();

      const wasAllowed = press(aSeekKey());

      expect(wasAllowed).toBe(true);
      expect(seeks).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the keys are not available", () => {
    test("WHEN a seek key is pressed THEN it is left alone", () => {
      renderSeekKeys(false);

      const wasAllowed = press(aSeekKey());

      expect(wasAllowed).toBe(true);
      expect(seeks).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a caller whose callback changes between renders", () => {
    test("WHEN a seek key is pressed THEN the latest callback is the one told", () => {
      const firstCallback = vi.fn<SeekReport>();
      const { rerender } = renderHook(
        ({ onSeek }) => useSeekKeys({ player: playerOwner, enabled: true, onSeek }),
        { initialProps: { onSeek: firstCallback } },
      );
      rerender({ onSeek: seeks });

      press(aSeekKey());

      expect(firstCallback).not.toHaveBeenCalled();
      expect(seeks).toHaveBeenCalledTimes(1);
    });
  });
});
