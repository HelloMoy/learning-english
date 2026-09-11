import {
  DEFAULT_SEEK_STEP_SECONDS,
  SEEK_STEP_OPTIONS_SECONDS,
  type SeekStepSeconds,
} from "@/lib/seek-run/seek-run";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import type { ErrorInfo } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from "vitest";

import { SEEK_STEP_STORAGE_KEY, useSeekStep } from "./use-seek-step";

/** An offered step other than the default, so a change is always observable. */
function aChosenStep(): SeekStepSeconds {
  return faker.helpers.arrayElement(
    SEEK_STEP_OPTIONS_SECONDS.filter((step) => step !== DEFAULT_SEEK_STEP_SECONDS),
  );
}

/**
 * A `Storage` backed by a plain map, so each test starts empty without
 * touching the jsdom window the other suites share.
 */
function aStorage(seed?: Record<string, string>): Storage {
  const entries = new Map(Object.entries(seed ?? {}));
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
  };
}

/** A `Storage` that refuses every operation, as a hardened browser's does. */
function aDeniedStorage(): Storage {
  const deny = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  return {
    length: 0,
    key: deny,
    getItem: deny,
    setItem: deny,
    removeItem: deny,
    clear: deny,
  };
}

describe("useSeekStep", () => {
  describe("GIVEN a learner who has never chosen", () => {
    test("WHEN nothing is stored THEN the default step is in force", () => {
      const { result } = renderHook(() => useSeekStep(aStorage()));

      expect(result.current.stepSeconds).toBe(DEFAULT_SEEK_STEP_SECONDS);
    });
  });

  describe("GIVEN a step stored by an earlier visit", () => {
    test.each(SEEK_STEP_OPTIONS_SECONDS)("WHEN %i is stored THEN it is in force", (step) => {
      const { result } = renderHook(() =>
        useSeekStep(aStorage({ [SEEK_STEP_STORAGE_KEY]: String(step) })),
      );

      expect(result.current.stepSeconds).toBe(step);
    });

    test("WHEN the stored value is not one of the offered steps THEN the default is in force", () => {
      const { result } = renderHook(() =>
        useSeekStep(aStorage({ [SEEK_STEP_STORAGE_KEY]: "seven" })),
      );

      expect(result.current.stepSeconds).toBe(DEFAULT_SEEK_STEP_SECONDS);
    });
  });

  describe("GIVEN the learner chooses a step", () => {
    test("WHEN one is chosen THEN it is in force at once", () => {
      const chosen = aChosenStep();
      const storage = aStorage();
      const { result } = renderHook(() => useSeekStep(storage));

      act(() => result.current.choose(chosen));

      expect(result.current.stepSeconds).toBe(chosen);
    });

    test("WHEN one is chosen THEN it is written where the next visit reads it", () => {
      const chosen = aChosenStep();
      const storage = aStorage();
      const { result } = renderHook(() => useSeekStep(storage));

      act(() => result.current.choose(chosen));

      expect(storage.getItem(SEEK_STEP_STORAGE_KEY)).toBe(String(chosen));
    });

    test("WHEN one is chosen THEN every consumer sees it, not only the one that chose", () => {
      // The gestures and the menu are separate consumers in one tree; a choice
      // made in the menu has to reach the gestures without a provider between.
      const chosen = aChosenStep();
      const storage = aStorage();
      const chooser = renderHook(() => useSeekStep(storage));
      const watcher = renderHook(() => useSeekStep(storage));

      act(() => chooser.result.current.choose(chosen));

      expect(watcher.result.current.stepSeconds).toBe(chosen);
    });
  });

  describe("GIVEN the learner has the app open in another tab", () => {
    test("WHEN that tab writes a step THEN this one follows", () => {
      const chosen = aChosenStep();
      const storage = aStorage();
      const { result } = renderHook(() => useSeekStep(storage));

      act(() => {
        storage.setItem(SEEK_STEP_STORAGE_KEY, String(chosen));
        window.dispatchEvent(new StorageEvent("storage", { key: SEEK_STEP_STORAGE_KEY }));
      });

      expect(result.current.stepSeconds).toBe(chosen);
    });
  });

  describe("GIVEN a browser that will not store anything", () => {
    test("WHEN reading throws THEN the default step is in force", () => {
      const { result } = renderHook(() => useSeekStep(aDeniedStorage()));

      expect(result.current.stepSeconds).toBe(DEFAULT_SEEK_STEP_SECONDS);
    });

    test("WHEN writing throws THEN the choice is dropped rather than raised", () => {
      const { result } = renderHook(() => useSeekStep(aDeniedStorage()));

      expect(() => act(() => result.current.choose(aChosenStep()))).not.toThrow();
      expect(result.current.stepSeconds).toBe(DEFAULT_SEEK_STEP_SECONDS);
    });
  });

  describe("GIVEN the lesson page is server-rendered and then hydrated", () => {
    // The one case `renderHook` cannot show: a client-only render reads
    // storage on its first pass, where a hydrating one must not.
    function StepReadout({ storage }: { storage: Storage }) {
      return <span data-testid="step">{useSeekStep(storage).stepSeconds}</span>;
    }

    let container: HTMLElement;
    let onRecoverableError: Mock<(error: unknown, errorInfo: ErrorInfo) => void>;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.append(container);
      onRecoverableError = vi.fn();
    });

    afterEach(() => {
      container.remove();
    });

    test("WHEN a step is already stored THEN hydration matches the server and then adopts it", () => {
      const chosen = aChosenStep();
      const storage = aStorage({ [SEEK_STEP_STORAGE_KEY]: String(chosen) });
      container.innerHTML = renderToString(<StepReadout storage={storage} />);

      // The server has no storage to read, so its markup is the default —
      // which is exactly what the hydration render has to agree with.
      expect(container.textContent).toBe(String(DEFAULT_SEEK_STEP_SECONDS));

      act(() => {
        hydrateRoot(container, <StepReadout storage={storage} />, { onRecoverableError });
      });

      // No mismatch, and React adopts the client snapshot on its own once the
      // commit is done — the hook needs no nudge of its own to make it happen.
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.textContent).toBe(String(chosen));
    });
  });
});
