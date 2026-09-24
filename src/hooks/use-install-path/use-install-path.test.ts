import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useInstallPrompt } from "../use-install-prompt/use-install-prompt";
import { useSafariInstallSurface } from "../use-safari-install-surface/use-safari-install-surface";
import { useInstallPath } from "./use-install-path";

vi.mock("../use-safari-install-surface/use-safari-install-surface", () => ({
  useSafariInstallSurface: vi.fn(),
}));
vi.mock("../use-install-prompt/use-install-prompt", () => ({
  useInstallPrompt: vi.fn(),
}));

const mockUseSafariInstallSurface = vi.mocked(useSafariInstallSurface);
const mockUseInstallPrompt = vi.mocked(useInstallPrompt);

const accept = vi.fn();

const givenBrowser = ({
  safariSurface = "none",
  offersAnInstall = false,
}: {
  safariSurface?: "iphone" | "ipad" | "mac" | "none";
  offersAnInstall?: boolean;
}) => {
  mockUseSafariInstallSurface.mockReturnValue(safariSurface);
  mockUseInstallPrompt.mockReturnValue(
    offersAnInstall ? { canInstall: true, accept } : { canInstall: false },
  );
};

describe("useInstallPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN a Safari that can only be taught the flow", () => {
    test.each([
      ["an iPhone", "iphone", "guide"],
      ["an iPad", "ipad", "ipad-guide"],
      ["a Mac", "mac", "mac-guide"],
    ] as const)("WHEN it is %s THEN that platform's guide is the route", (_name, surface, kind) => {
      // Three guides rather than one: the taps differ, and so do the surfaces
      // they happen on.
      givenBrowser({ safariSurface: surface });

      expect(renderHook(() => useInstallPath()).result.current).toEqual({ kind });
    });
  });

  describe("GIVEN a browser that offers to do the install itself", () => {
    test("WHEN resolved THEN the learner is sent to the prompt, carrying the offer", () => {
      givenBrowser({ offersAnInstall: true });

      expect(renderHook(() => useInstallPath()).result.current).toEqual({
        kind: "prompt",
        accept,
      });
    });
  });

  describe("GIVEN a browser that somehow does both", () => {
    test("WHEN resolved THEN performing the install beats describing it", () => {
      // They do not overlap today — Safari fires no such event — but writing
      // the precedence down means a WebKit that starts firing one does the
      // better thing without another change here.
      givenBrowser({ safariSurface: "iphone", offersAnInstall: true });

      expect(renderHook(() => useInstallPath()).result.current.kind).toBe("prompt");
    });
  });

  describe("GIVEN a browser with no way in", () => {
    test("WHEN resolved THEN there is no path at all", () => {
      givenBrowser({});

      expect(renderHook(() => useInstallPath()).result.current).toEqual({ kind: "none" });
    });
  });
});
