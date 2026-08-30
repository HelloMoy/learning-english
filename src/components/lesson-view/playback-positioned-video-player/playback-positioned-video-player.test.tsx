import { LessonId } from "@/domain/entities/ids/ids";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PlaybackPositionedVideoPlayer } from "./playback-positioned-video-player";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const mockStorage = new Map<string, string>();

const storageKeyFor = (lessonId: string) => `learning-english:playback:${lessonId}`;

/**
 * The resume prompt is a NiceModal-driven `Dialog`, so it is portalled to the
 * document root rather than rendered inside the player. Every render needs the
 * provider, and every assertion about the prompt goes through `screen`, not the
 * returned container.
 */
const renderPlayer = (ui: React.ReactElement) =>
  render(<NiceModal.Provider>{ui}</NiceModal.Provider>);

/** Lets the async mount-read resolve and the modal commit. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

const videoIn = (container: HTMLElement) => container.querySelector("video") as HTMLVideoElement;

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

      const { getByTitle } = renderPlayer(
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

      const { container } = renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          poster={poster}
        />,
      );

      expect(container.querySelector("video")).toHaveAttribute("poster", poster);
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

      const { container } = renderPlayer(
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

      const { container } = renderPlayer(
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

  describe("Resume dialog wiring", () => {
    test("WHEN there is no saved position THEN no dialog is opened", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the saved position is below the threshold THEN no dialog is opened", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), "10");

      renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the saved position is within the last 10 seconds THEN no dialog is opened", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), "595");

      renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the saved position passes the thresholds THEN a dialog opens showing that position", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), "180");

      renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveTextContent("03:00");
    });

    test("WHEN the player re-renders THEN the dialog is not opened a second time", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), "180");

      const { rerender } = renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );
      await settle();

      rerender(
        <NiceModal.Provider>
          <PlaybackPositionedVideoPlayer
            lessonId={lessonId}
            source="/videos/x.mp4"
            title="t"
            durationSeconds={600}
          />
        </NiceModal.Provider>,
      );
      await settle();

      expect(screen.getAllByRole("dialog")).toHaveLength(1);
    });

    test("WHEN the dialog is open THEN the video has not been seeked yet", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), "180");

      const { container } = renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );
      await screen.findByRole("dialog");

      // Seeking is the learner's decision, not a side effect of being offered
      // the choice — see the "restart from the beginning" requirement.
      expect(videoIn(container).currentTime).toBe(0);
    });
  });

  describe("Acting on the learner's choice", () => {
    const renderWithSavedPosition = async (seconds: string) => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), seconds);

      const { container, rerender } = renderPlayer(
        <PlaybackPositionedVideoPlayer
          lessonId={lessonId}
          source="/videos/x.mp4"
          title="t"
          durationSeconds={600}
        />,
      );
      await screen.findByRole("dialog");

      return { lessonId, container, rerender };
    };

    test("WHEN Resume is chosen THEN the video seeks to the saved position and the dialog closes", async () => {
      const user = userEvent.setup();
      const { container } = await renderWithSavedPosition("180");

      await user.click(screen.getByRole("button", { name: "resumeCta" }));
      await settle();

      expect(videoIn(container).currentTime).toBe(180);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN Restart is chosen THEN the video stays at the beginning and the dialog closes", async () => {
      const user = userEvent.setup();
      const { container } = await renderWithSavedPosition("180");

      await user.click(screen.getByRole("button", { name: "restartCta" }));
      await settle();

      expect(videoIn(container).currentTime).toBe(0);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the dialog is dismissed with Escape THEN the video stays at the beginning", async () => {
      const user = userEvent.setup();
      const { container } = await renderWithSavedPosition("180");

      await user.keyboard("{Escape}");
      await settle();

      expect(videoIn(container).currentTime).toBe(0);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the dialog is dismissed THEN the saved position is left intact for the next visit", async () => {
      const user = userEvent.setup();
      const { lessonId } = await renderWithSavedPosition("180");

      await user.keyboard("{Escape}");
      await settle();

      expect(mockStorage.get(storageKeyFor(lessonId))).toBe("180");
    });

    /**
     * Regression: the `usePlaybackPosition` hook used to return a new object on
     * every render, which made the mount-read effect's `position` dep appear
     * "changed" every render — re-firing the read and re-opening the prompt
     * even after the learner had answered it. The hook is memoized on
     * `lessonId` now, and the player additionally guards on a ref, so a
     * re-render after a choice must not bring the dialog back.
     */
    test("WHEN the player re-renders after a choice THEN the dialog does not re-open", async () => {
      const user = userEvent.setup();
      const { lessonId, rerender } = await renderWithSavedPosition("180");

      await user.click(screen.getByRole("button", { name: "resumeCta" }));
      await settle();

      rerender(
        <NiceModal.Provider>
          <PlaybackPositionedVideoPlayer
            lessonId={lessonId}
            source="/videos/x.mp4"
            title="t"
            durationSeconds={600}
          />
        </NiceModal.Provider>,
      );
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Storage integrity (no overwriting cold-load)", () => {
    test("WHEN rendered with a saved position THEN the saved value is NOT overwritten with 0", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(`learning-english:playback:${lessonId}`, "180");

      renderPlayer(
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
});
