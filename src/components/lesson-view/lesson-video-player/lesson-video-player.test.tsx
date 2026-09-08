import "@testing-library/jest-dom/vitest";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import type { MediaPlayerInstance } from "@vidstack/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { createRef } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonVideoPlayer } from "./lesson-video-player";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUseTheme = vi.mocked(useTheme);

/**
 * These assertions stay deliberately shallow — see design.md §D3.
 *
 * jsdom has no media pipeline, and the player defers loading behind an
 * `IntersectionObserver` that never fires under test, so nothing here can
 * observe real playback. What it *can* observe is the contract this component
 * owns: which props reach the player instance, and that the overlay slot is
 * rendered inside the player box. Playback itself is Playwright's job.
 */
function renderPlayer(
  props: Partial<React.ComponentProps<typeof LessonVideoPlayer>> = {},
  ref?: React.RefObject<MediaPlayerInstance | null>,
) {
  return render(
    <LessonVideoPlayer
      ref={ref}
      source="/videos/lesson.mp4"
      title="Long vs short vowels"
      {...props}
    />,
  );
}

describe("LessonVideoPlayer", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    mockUseTheme.mockReturnValue({ resolvedTheme: "dark" } as never);
  });

  describe("GIVEN a video lesson", () => {
    test("WHEN rendered THEN the player carries the lesson source and title", () => {
      const source = "/videos/" + faker.system.fileName({ extensionCount: 0 }) + ".mp4";
      const title = faker.lorem.sentence();
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({ source, title }, ref);

      // `state.sources` is what the player was *given*; `state.source` is the
      // one it resolved after loading, and loading never starts under jsdom.
      expect(ref.current?.state.sources).toEqual([{ src: source, type: "video/mp4" }]);
      expect(ref.current?.state.title).toBe(title);
    });

    test("WHEN rendered THEN it is a video-type player region", () => {
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({}, ref);

      expect(ref.current?.state.viewType).toBe("video");
      expect(screen.getByRole("region")).toBeInTheDocument();
    });

    test("WHEN an aria label is given THEN it is the player's accessible name", () => {
      // Vidstack composes its own English label ("Video Player - <title>")
      // unless `ariaLabel` is set, so this asserts the label is ours and
      // therefore localizable.
      const ariaLabel = faker.lorem.words(3);

      renderPlayer({ ariaLabel });

      expect(screen.getByRole("region", { name: ariaLabel })).toBeInTheDocument();
    });
  });

  describe("GIVEN a lesson whose video lives on YouTube", () => {
    const VIDEO_ID = "yY7RWGUbqng";

    test("WHEN the source is a YouTube link THEN the player is given the YouTube provider", () => {
      // `youtube/<id>` is Vidstack's own provider form. Handing it the link
      // as an MP4 source, which is what every lesson used to get, makes the
      // provider try to read a watch page as a byte stream.
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer(
        { source: `https://www.youtube.com/embed/${VIDEO_ID}?si=nB8sjE4SQJoB0Itv` },
        ref,
      );

      expect(ref.current?.state.sources).toEqual([
        { src: `youtube/${VIDEO_ID}`, type: "video/youtube" },
      ]);
    });

    test("WHEN the source is not a YouTube link THEN it is still given as a direct video source", () => {
      const source = "/videos/" + faker.system.fileName({ extensionCount: 0 }) + ".mp4";
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({ source }, ref);

      expect(ref.current?.state.sources).toEqual([{ src: source, type: "video/mp4" }]);
    });

    test("WHEN a YouTube lesson has no poster THEN none is painted over the provider's own", () => {
      // The YouTube provider discovers its own thumbnail, so the black idle
      // frame that makes an explicit `Poster` necessary for a self-hosted
      // lesson never happens here.
      const { container } = renderPlayer({ source: `https://youtu.be/${VIDEO_ID}` });

      expect(container.querySelector(".vds-poster")).toBeNull();
    });

    test("WHEN a YouTube lesson has a poster THEN the lesson's own thumbnail still wins", () => {
      const poster = "/thumbnails/lecture.jpg";

      const { container } = renderPlayer({ source: `https://youtu.be/${VIDEO_ID}`, poster });

      expect(container.querySelector(".vds-poster")).not.toBeNull();
    });
  });

  describe("GIVEN the lesson's poster", () => {
    test("WHEN a poster is provided THEN the player receives it", () => {
      const poster = "/thumbnails/" + faker.system.fileName({ extensionCount: 0 }) + ".jpg";
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({ poster }, ref);

      expect(ref.current?.state.poster).toBe(poster);
    });

    test("WHEN no poster is provided THEN the player has none", () => {
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({}, ref);

      expect(ref.current?.state.poster).toBe("");
    });

    test("WHEN a poster is provided THEN an element is rendered to paint it", () => {
      // The Default Layout does not draw the poster itself — it has no
      // `Poster` in its tree — so a player without an explicit one shows a
      // black idle frame however good the thumbnail is.
      const { container } = renderPlayer({ poster: "/thumbnails/lecture.jpg" });

      expect(container.querySelector(".vds-poster")).not.toBeNull();
    });
  });

  describe("GIVEN the app's theme", () => {
    test.each(["dark", "light"] as const)(
      "WHEN the app resolves to %s THEN the layout uses that color scheme",
      (theme) => {
        // Left to itself the layout follows the operating system, which this
        // app's own theme toggle does not — the chrome would sit in light mode
        // inside a dark page.
        mockUseTheme.mockReturnValue({ resolvedTheme: theme } as never);

        const { container } = renderPlayer();

        expect(container.querySelector(".vds-video-layout")).toHaveClass(theme);
      },
    );
  });

  describe("GIVEN the in-player overlay slot", () => {
    test("WHEN children are passed THEN they render inside the player box", () => {
      renderPlayer({ children: <div data-testid="resume-overlay">Resume?</div> });

      expect(screen.getByRole("region")).toContainElement(screen.getByTestId("resume-overlay"));
    });

    test("WHEN no children are passed THEN the player still renders", () => {
      renderPlayer();

      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });

  describe("GIVEN the overlay needs the player's keyboard shortcuts out of the way", () => {
    // The shortcuts themselves cannot be exercised here — they toggle
    // playback, and there is none. `$props` is the nearest observable fact:
    // whether the flag reached the player at all.
    const keyDisabledOf = (player: MediaPlayerInstance | null) => player?.$props.keyDisabled();

    test("WHEN keyDisabled is set THEN the player stops handling keys", () => {
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({ keyDisabled: true }, ref);

      expect(keyDisabledOf(ref.current)).toBe(true);
    });

    test("WHEN keyDisabled is not set THEN the player keeps its shortcuts", () => {
      const ref = createRef<MediaPlayerInstance>();

      renderPlayer({}, ref);

      expect(keyDisabledOf(ref.current)).toBe(false);
    });
  });

  describe("GIVEN the player's chrome must be localized", () => {
    test("WHEN rendered THEN every layout word is read from the VideoPlayer namespace", () => {
      renderPlayer();

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.VideoPlayer");
    });
  });
});
