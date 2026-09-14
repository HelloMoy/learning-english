import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { describe, expect, test } from "vitest";

import { BUFFERING_CORE_CLASS, VideoBufferingIndicator } from "./video-buffering-indicator";

/**
 * The indicator is rendered inside a real player, as the layout's slot would,
 * because Vidstack's `Spinner` parts are library components and the point of
 * the test is that they are the ones on screen — the same ring the Default
 * Layout draws, so every existing token keeps applying to it.
 */
function renderIndicator() {
  return render(
    <MediaPlayer
      src="/videos/lesson.mp4"
      viewType="video"
    >
      <MediaProvider />
      <VideoBufferingIndicator />
    </MediaPlayer>,
  );
}

describe("VideoBufferingIndicator", () => {
  describe("GIVEN the layout's buffering slot", () => {
    test("WHEN rendered THEN it draws the Default Layout's own ring", () => {
      const { container } = renderIndicator();

      const indicator = container.querySelector(".vds-buffering-indicator");
      expect(indicator).not.toBeNull();
      expect(indicator?.querySelector(".vds-buffering-spinner")).not.toBeNull();
      expect(indicator?.querySelector(".vds-buffering-track")).not.toBeNull();
      expect(indicator?.querySelector(".vds-buffering-track-fill")).not.toBeNull();
    });

    test("WHEN rendered THEN it adds an opaque core at the centre of the ring", () => {
      // The core is what hides the embed's own 36px spinner; the ring alone is
      // hollow and lets it show.
      const { container } = renderIndicator();

      expect(
        container.querySelector(`.vds-buffering-indicator .${BUFFERING_CORE_CLASS}`),
      ).not.toBeNull();
    });

    test("WHEN rendered THEN it is decorative", () => {
      // The player's announcer reports buffering; a second live report from
      // the picture would be noise for a screen reader.
      const { container } = renderIndicator();

      expect(container.querySelector(".vds-buffering-indicator")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });
});
