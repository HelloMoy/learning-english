import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useServiceWorkerRegistration } from "./use-service-worker-registration";

/** jsdom implements no service worker container at all. */
const stubServiceWorker = (register: ReturnType<typeof vi.fn>) => {
  vi.stubGlobal("navigator", { serviceWorker: { register } });
};

/** Lets a swallowed rejection settle, so an unhandled one would fail the test. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useServiceWorkerRegistration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("GIVEN a browser with service worker support", () => {
    test("WHEN mounted THEN the worker is registered", () => {
      const register = vi.fn().mockResolvedValue({});
      stubServiceWorker(register);

      renderHook(() => useServiceWorkerRegistration());

      expect(register).toHaveBeenCalledWith("/sw.js");
    });

    test("WHEN re-rendered THEN it does not register again", () => {
      const register = vi.fn().mockResolvedValue({});
      stubServiceWorker(register);
      const { rerender } = renderHook(() => useServiceWorkerRegistration());

      rerender();

      expect(register).toHaveBeenCalledOnce();
    });

    test("WHEN the registration is refused THEN nothing is thrown", async () => {
      // A refusal is not the learner's problem: the worker only exists so the
      // browser will offer an install, and without it the app is what it is
      // today.
      const register = vi.fn().mockRejectedValue(new Error("refused"));
      stubServiceWorker(register);

      expect(() => renderHook(() => useServiceWorkerRegistration())).not.toThrow();
      await settle();
    });
  });

  describe("GIVEN a browser without service worker support", () => {
    test("WHEN mounted THEN nothing is attempted and nothing is thrown", () => {
      vi.stubGlobal("navigator", {});

      expect(() => renderHook(() => useServiceWorkerRegistration())).not.toThrow();
    });
  });
});
