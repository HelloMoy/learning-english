import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { act, fireEvent, render } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PlaybackPositionedVideoPlayer } from "./playback-positioned-video-player";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const mockStorage = new Map<string, string>();

beforeEach(() => {
  // Echo the key plus any ICU values, so the overlay's interpolated
  // "resume from MM:SS" copy stays assertable without real translations.
  mockUseTranslations.mockReturnValue(((key: string, values?: Record<string, unknown>) =>
    values === undefined ? key : `${key} ${Object.values(values).join(" ")}`) as never);
  mockStorage.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mockStorage.set(key, value);
      },
      removeItem: (key: string) => {
        mockStorage.delete(key);
      },
      clear: () => mockStorage.clear(),
      key: () => null,
      length: 0,
    },
  });
});

afterEach(() => {
  mockStorage.clear();
});

describe("PlaybackPositionedVideoPlayer", () => {
  describe("Rendering", () => {
    test("WHEN rendered THEN it shows a <video controls> with the source and title", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const source = "/videos/" + faker.system.fileName();
      const title = faker.lorem.sentence();

      const { getByTitle } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source={source}
          title={title}
        />,
      );

      const video = getByTitle(title) as HTMLVideoElement;
      expect(video.tagName).toBe("VIDEO");
      expect(video).toHaveAttribute("controls");
      expect(video.querySelector("source")?.getAttribute("src")).toBe(source);
    });

    test("WHEN a poster is provided THEN the <video> receives the poster attribute", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const poster = faker.internet.url();

      const { container } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          poster={poster}
        />,
      );

      expect(container.querySelector("video")).toHaveAttribute("poster", poster);
    });

    test("WHEN rendered THEN the wrapper provides a positioning context for the resume overlay", () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      const { container } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
        />,
      );

      // The wrapper wraps the video + overlay in a `relative` container so
      // the absolute-positioned overlay can anchor to the video bounds.
      const positioningContext = container.querySelector("div.relative");
      expect(positioningContext).not.toBeNull();
    });
  });

  describe("Playback start reporting", () => {
    /**
     * The wrapper already owns the only `play` subscription (it flips the
     * interaction gate there). `onPlaybackStart` rides that same listener so
     * "playback has begun" has a single source of truth — `LessonView` uses
     * it to retire the gold title cover.
     */
    test("WHEN the <video> emits play THEN onPlaybackStart is called", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const onPlaybackStart = vi.fn();

      const { container } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          onPlaybackStart={onPlaybackStart}
        />,
      );

      const video = container.querySelector("video") as HTMLVideoElement;
      act(() => {
        fireEvent.play(video);
      });

      expect(onPlaybackStart).toHaveBeenCalled();
    });

    test("WHEN no onPlaybackStart is provided THEN a play event does not throw", () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      const { container } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
        />,
      );

      const video = container.querySelector("video") as HTMLVideoElement;
      expect(() => {
        act(() => {
          fireEvent.play(video);
        });
      }).not.toThrow();
    });
  });

  describe("Resume overlay wiring", () => {
    test("WHEN there is no saved position THEN the overlay is not rendered", () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      const { queryByRole } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      expect(queryByRole("dialog")).toBeNull();
    });

    test("WHEN a saved position passes the thresholds THEN the overlay renders with that position", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(`learning-english:playback:${lessonId}`, "180");

      const { findByRole } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      const dialog = await findByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent("03:00");
    });

    test("WHEN a saved position is below the threshold THEN the overlay does not render", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(`learning-english:playback:${lessonId}`, "10");

      const { container } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      // Let the mount effect resolve.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  describe("Storage integrity (no overwriting cold-load)", () => {
    test("WHEN rendered with a saved position THEN the saved value is NOT overwritten with 0", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(`learning-english:playback:${lessonId}`, "180");

      render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      // After mount, the stored value remains — the wrapper reads on mount
      // but does NOT write before user interaction.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockStorage.get(`learning-english:playback:${lessonId}`)).toBe("180");
    });
  });

  describe("Resume / Restart closure", () => {
    /**
     * Regression: the `usePlaybackPosition` hook used to return a new object
     * on every render, which made the mount-read `useEffect`'s `position`
     * dep appear "changed" every render. After a `setSavedPosition(null)`
     * from a Resume / Restart click, the effect refired and reseeded
     * `savedPosition` from storage (where the value was still 180),
     * re-opening the overlay. The hook is now memoized on `lessonId`,
     * so the effect fires only on mount or when the lesson actually changes.
     * This test exercises the closure path: clicking must keep the overlay
     * closed after a re-render cycle.
     */
    test("WHEN Resume clears the overlay AND storage still has the saved value THEN the overlay does NOT re-open after a microtask", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(`learning-english:playback:${lessonId}`, "180");

      const { container, rerender } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      // Wait for the async mount-read to set savedPosition and render the
      // overlay. Three ticks covers the promise resolution + React commit.
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      const dialogBeforeClick = container.querySelector('[role="dialog"]');
      expect(dialogBeforeClick).not.toBeNull();

      const ResumeBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        (b.textContent ?? "").includes("resumeCta"),
      ) as HTMLButtonElement | undefined;
      expect(ResumeBtn).toBeDefined();

      await act(async () => {
        ResumeBtn?.click();
      });

      // Force a re-render. With the bug, the mount-read would re-fire
      // (because `position` returned a new object each render) and
      // re-seed `savedPosition` from storage — re-opening the dialog.
      rerender(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    test("WHEN Restart clears the overlay AND storage still has the saved value THEN the overlay does NOT re-open after a microtask", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(`learning-english:playback:${lessonId}`, "180");

      const { container, rerender } = render(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();

      const RestartBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        (b.textContent ?? "").includes("restartCta"),
      ) as HTMLButtonElement | undefined;
      expect(RestartBtn).toBeDefined();

      await act(async () => {
        RestartBtn?.click();
      });

      rerender(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });
  });
});
