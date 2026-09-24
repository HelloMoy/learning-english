import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useIsHydrated } from "../use-is-hydrated/use-is-hydrated";
import { useInstallPrompt } from "./use-install-prompt";

vi.mock("../use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: vi.fn(),
}));

const mockUseIsHydrated = vi.mocked(useIsHydrated);

/**
 * The event Chromium fires and jsdom has never heard of. `cancelable` is what
 * makes `preventDefault` observable, which is the whole point of one of the
 * assertions below.
 */
const offerAnInstall = () => {
  const offer = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
  });

  act(() => {
    window.dispatchEvent(offer);
  });

  return offer;
};

/** jsdom ships no `navigator.standalone`, and the global stub answers no to every query. */
const stubLaunchedFromHomeScreen = () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      media: "(display-mode: standalone)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

describe("useInstallPrompt", () => {
  beforeEach(() => {
    mockUseIsHydrated.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("GIVEN a browser that offers an install", () => {
    test("WHEN the offer arrives THEN the app can be installed", () => {
      const { result } = renderHook(() => useInstallPrompt());

      offerAnInstall();

      expect(result.current.canInstall).toBe(true);
    });

    test("WHEN the offer arrives THEN the browser's own banner is suppressed", () => {
      // Left to its default the browser shows its own promotion alongside ours.
      renderHook(() => useInstallPrompt());

      const offer = offerAnInstall();

      expect(offer.defaultPrevented).toBe(true);
    });

    test("WHEN the learner accepts THEN the browser's install dialog is opened", () => {
      const { result } = renderHook(() => useInstallPrompt());
      const offer = offerAnInstall();

      const accepted = result.current;
      if (!accepted.canInstall) throw new Error("expected an install offer");
      act(() => {
        accepted.accept();
      });

      expect(offer.prompt).toHaveBeenCalledOnce();
    });

    test("WHEN the offer has been accepted THEN it is not offered again", () => {
      // The captured event is single-use: a second `prompt()` on it is refused.
      const { result } = renderHook(() => useInstallPrompt());
      offerAnInstall();

      const accepted = result.current;
      if (!accepted.canInstall) throw new Error("expected an install offer");
      act(() => {
        accepted.accept();
      });

      expect(result.current.canInstall).toBe(false);
    });

    test("WHEN the browser reports the install THEN the offer is withdrawn", () => {
      const { result } = renderHook(() => useInstallPrompt());
      offerAnInstall();

      act(() => {
        window.dispatchEvent(new Event("appinstalled"));
      });

      expect(result.current.canInstall).toBe(false);
    });
  });

  describe("GIVEN the browser offered before the app was listening", () => {
    test("WHEN the offer was stashed before hydration THEN it is still available", () => {
      // Chromium fires this as soon as it judges the site installable, which is
      // routinely before hydration, and it never fires again. Measured on
      // Android Chrome 149: without the stash the prompt never appears at all.
      const stashed = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: vi.fn().mockResolvedValue(undefined),
      });
      vi.stubGlobal("__installOffer", stashed);

      expect(renderHook(() => useInstallPrompt()).result.current.canInstall).toBe(true);
    });

    test("WHEN a stashed offer is accepted THEN it is not adopted again", () => {
      const stashed = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: vi.fn().mockResolvedValue(undefined),
      });
      vi.stubGlobal("__installOffer", stashed);
      const first = renderHook(() => useInstallPrompt());

      const offer = first.result.current;
      if (!offer.canInstall) throw new Error("expected a stashed offer");
      act(() => {
        offer.accept();
      });

      expect(renderHook(() => useInstallPrompt()).result.current.canInstall).toBe(false);
    });
  });

  describe("GIVEN a browser that offers nothing", () => {
    test("WHEN no offer has arrived THEN the app cannot be installed", () => {
      const { result } = renderHook(() => useInstallPrompt());

      expect(result.current.canInstall).toBe(false);
    });
  });

  describe("GIVEN the app is already on the home screen", () => {
    test("WHEN an offer arrives anyway THEN it is not passed on", () => {
      stubLaunchedFromHomeScreen();
      const { result } = renderHook(() => useInstallPrompt());

      offerAnInstall();

      expect(result.current.canInstall).toBe(false);
    });
  });

  describe("GIVEN the page has not finished hydrating", () => {
    test("WHEN an offer has arrived THEN it is withheld until hydration commits", () => {
      // Server and client markup have to agree; the offer is a browser fact.
      mockUseIsHydrated.mockReturnValue(false);
      const { result } = renderHook(() => useInstallPrompt());

      offerAnInstall();

      expect(result.current.canInstall).toBe(false);
    });
  });
});
