import "@testing-library/jest-dom/vitest";

import { COMPACT_CHROME_MAX_WIDTH } from "@/lib/player-layout/player-layout";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useMediaRemote, useMediaState } from "@vidstack/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { VideoCenterPlayButton } from "./video-center-play-button";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("@vidstack/react", () => ({
  useMediaRemote: vi.fn(),
  useMediaState: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUseMediaRemote = vi.mocked(useMediaRemote);
const mockUseMediaState = vi.mocked(useMediaState);

/**
 * The two words the control borrows from the player's existing vocabulary.
 * Spanish, so a test that starts passing on the library's English defaults
 * fails here instead.
 */
const MESSAGES: Record<string, string> = {
  play: "Reproducir",
  pause: "Pausar",
};

const A_PHONE_IN_PORTRAIT = COMPACT_CHROME_MAX_WIDTH - 1;
const THE_PLAYER_ENLARGED_IN_LANDSCAPE = COMPACT_CHROME_MAX_WIDTH + 138;

/** The player as it is whenever this control is meant to be on screen. */
const A_TOUCH_PLAYER_SHOWING_ITS_CONTROLS: Record<string, unknown> = {
  pointer: "coarse",
  controlsVisible: true,
  width: THE_PLAYER_ENLARGED_IN_LANDSCAPE,
  paused: false,
};

function renderButton(player: Record<string, unknown> = {}) {
  mockUseMediaState.mockImplementation(
    ((prop: string) => ({ ...A_TOUCH_PLAYER_SHOWING_ITS_CONTROLS, ...player })[prop]) as never,
  );
  return render(<VideoCenterPlayButton />);
}

describe("VideoCenterPlayButton", () => {
  let togglePaused: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    togglePaused = vi.fn();
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
    mockUseMediaRemote.mockReturnValue({ togglePaused } as never);
  });

  describe("GIVEN a learner watching on a phone with the controls in view", () => {
    test("WHEN the lesson is playing THEN the control offers to pause it", () => {
      renderButton();

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.VideoPlayer");
      expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
    });

    test("WHEN the lesson is paused THEN the control offers to play it", () => {
      renderButton({ paused: true });

      expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Pausar" })).not.toBeInTheDocument();
    });

    test("WHEN the control is pressed THEN the player is asked to toggle playback", async () => {
      const user = userEvent.setup();
      renderButton();

      await user.click(screen.getByRole("button", { name: "Pausar" }));

      expect(togglePaused).toHaveBeenCalledTimes(1);
    });

    test("WHEN the lesson is playing THEN the control reports the playing state", () => {
      renderButton();

      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("GIVEN the chrome the library already gives a centre control", () => {
    test("WHEN the player is narrow enough for the compact chrome THEN nothing is drawn", () => {
      // The compact chrome draws a centre play button of its own.
      // Exactly one centre control may ever be on screen.
      renderButton({ width: A_PHONE_IN_PORTRAIT });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a learner watching with a mouse", () => {
    test("WHEN rendered THEN nothing is drawn", () => {
      // A click on the frame already toggles playback there.
      renderButton({ pointer: "fine" });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN an uninterrupted lesson", () => {
    test("WHEN the control bar is hidden THEN nothing is drawn over the video", () => {
      // Not merely invisible: an element that took the pointer here would
      // swallow the tap that is meant to reveal the control bar.
      renderButton({ controlsVisible: false });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
