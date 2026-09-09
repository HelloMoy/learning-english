import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useMediaState } from "@vidstack/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { VideoEnlargeButton } from "./video-enlarge-button";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("@vidstack/react", () => ({
  useMediaState: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUseMediaState = vi.mocked(useMediaState);

/** Stands in for the player's `canFullscreen` state. */
function browserFullscreenSupport(isSupported: boolean): void {
  mockUseMediaState.mockReturnValue(isSupported as never);
}

/**
 * The two words the control borrows from the player's existing vocabulary.
 * Spanish, so a test that starts passing on the library's English defaults
 * fails here instead.
 */
const MESSAGES: Record<string, string> = {
  "enter-fullscreen": "Pantalla completa",
  "exit-fullscreen": "Salir de pantalla completa",
};

function renderButton({
  isEnlarged = false,
  onToggle = vi.fn(),
}: {
  isEnlarged?: boolean;
  onToggle?: () => void;
} = {}) {
  const view = render(
    <VideoEnlargeButton
      isEnlarged={isEnlarged}
      onToggle={onToggle}
    />,
  );
  return { ...view, onToggle };
}

describe("VideoEnlargeButton", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
    // The control is a fallback: unless stated otherwise, the browser cannot
    // take the player fullscreen and the fallback is what a learner gets.
    browserFullscreenSupport(false);
  });

  describe("GIVEN a browser that can take the player fullscreen", () => {
    test("WHEN rendered THEN the fallback stays out of the way", () => {
      // The library's own fullscreen button is still in the chrome beside
      // this one, and it is the affordance wherever the platform can serve
      // it. Two enlarge controls in one control bar is the bug this prevents.
      browserFullscreenSupport(true);

      renderButton();

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    test("WHEN rendered THEN it asks the player about the capability, not the platform", () => {
      browserFullscreenSupport(true);

      renderButton();

      expect(mockUseMediaState).toHaveBeenCalledWith("canFullscreen");
    });
  });

  describe("GIVEN the video sits in the page", () => {
    test("WHEN rendered THEN it offers to enlarge, named from the player's own namespace", () => {
      renderButton();

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.VideoPlayer");
      expect(screen.getByRole("button", { name: "Pantalla completa" })).toBeInTheDocument();
    });

    test("WHEN pressed THEN it asks the player to enlarge", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderButton();

      await user.click(screen.getByRole("button", { name: "Pantalla completa" }));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test("WHEN rendered THEN it reports that the mode is not active", () => {
      renderButton();

      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("GIVEN the video fills the viewport", () => {
    test("WHEN rendered THEN it offers the way back rather than the way in", () => {
      renderButton({ isEnlarged: true });

      expect(
        screen.getByRole("button", { name: "Salir de pantalla completa" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Pantalla completa" })).not.toBeInTheDocument();
    });

    test("WHEN rendered THEN it reports that the mode is active", () => {
      renderButton({ isEnlarged: true });

      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    test("WHEN pressed THEN it asks the player to leave the mode", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderButton({ isEnlarged: true });

      await user.click(screen.getByRole("button", { name: "Salir de pantalla completa" }));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});
