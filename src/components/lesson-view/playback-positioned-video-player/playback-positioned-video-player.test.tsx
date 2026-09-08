import "@testing-library/jest-dom/vitest";

import { LessonId } from "@/domain/entities/ids/ids";
import { emitPlayerEvent } from "@/test-setup/stubs/vidstack-player";

import { faker } from "@faker-js/faker";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { MediaPlayerInstance } from "@vidstack/react";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PlaybackPositionedVideoPlayer } from "./playback-positioned-video-player";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const mockStorage = new Map<string, string>();
const storageKeyFor = (lessonId: string) => `learning-english:playback:${lessonId}`;

const DURATION_SECONDS = 600;
const RESUMABLE_SECONDS = 180;

/**
 * The wrapper is composition, and that is all these tests assert: does the
 * overlay appear for the right saved positions, at the right moment, and does
 * answering it dismiss the offer.
 *
 * Seeking and playing are deliberately **not** asserted here. jsdom loads no
 * media provider — the player reports `currentTime` as `0` whatever is asked
 * of it — so an assertion on the seek would be an assertion about the stub,
 * not the feature. `useResumeOnFirstPlay` covers the calls; Playwright covers
 * the real thing. See design.md §R3.
 */
function renderPlayer({
  lessonId = LessonId.parse(faker.string.uuid()),
  durationSeconds = DURATION_SECONDS,
  source = "/videos/lesson.mp4",
}: { lessonId?: LessonId; durationSeconds?: number; source?: string } = {}) {
  const playerRef = { current: null as MediaPlayerInstance | null };

  const view = render(
    <PlaybackPositionedVideoPlayer
      lessonId={lessonId}
      source={source}
      title="Long vs short vowels"
      durationSeconds={durationSeconds}
      ref={playerRef}
    />,
  );

  return { ...view, lessonId, playerRef };
}

/**
 * The rendered player, or a failed test. `vi.spyOn` needs a real object, and a
 * `null` ref means the render itself is broken — worth failing loudly on.
 */
function playerOf(playerRef: { current: MediaPlayerInstance | null }): MediaPlayerInstance {
  const player = playerRef.current;
  if (player === null) throw new Error("The player did not render");
  return player;
}

/** `emitPlayerEvent` wrapped in `act`, since every event here changes state. */
const emit = (player: MediaPlayerInstance | null, type: string, detail: unknown = null) => {
  act(() => {
    emitPlayerEvent(player, type, detail);
  });
};

/** Lets the async mount-read resolve and the overlay commit. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
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
  describe("GIVEN the learner has only just arrived", () => {
    test("WHEN a resumable position is stored THEN nothing is offered until playback begins", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      renderPlayer({ lessonId });
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the page has loaded THEN the stored position is not overwritten", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      renderPlayer({ lessonId });
      await settle();

      expect(mockStorage.get(storageKeyFor(lessonId))).toBe(String(RESUMABLE_SECONDS));
    });

    test("WHEN the player renders THEN its keyboard shortcuts are live", () => {
      const { playerRef } = renderPlayer();

      expect(playerRef.current?.$props.keyDisabled()).toBe(false);
    });
  });

  describe("GIVEN the play request has been issued but playback has not begun", () => {
    test("WHEN the player emits play THEN it is not held and no overlay appears", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const { playerRef } = renderPlayer({ lessonId });
      await settle();
      const pause = vi.spyOn(playerOf(playerRef), "pause");

      emit(playerRef.current, "play");
      await settle();

      // Holding here is what kills a provider driving a third-party embed: the
      // pause lands while the initial play request is still in flight, gets
      // swallowed, and the lesson never plays again — design.md §D1.
      expect(pause).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN playback then begins THEN the player is held and the overlay appears", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const { playerRef } = renderPlayer({ lessonId });
      await settle();
      const pause = vi.spyOn(playerOf(playerRef), "pause");

      emit(playerRef.current, "play");
      emit(playerRef.current, "playing");

      expect(await screen.findByRole("dialog")).toHaveTextContent("03:00");
      expect(pause).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN playback begins", () => {
    test("WHEN a resumable position is stored THEN the overlay appears inside the player", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const { playerRef } = renderPlayer({ lessonId });
      await settle();
      emit(playerRef.current, "playing");

      const overlay = await screen.findByRole("dialog");
      expect(overlay).toHaveTextContent("03:00");
      expect(screen.getByRole("region")).toContainElement(overlay);
    });

    test("WHEN the lesson is hosted on YouTube THEN the same overlay is offered", async () => {
      // The point of routing YouTube through the Vidstack provider instead of
      // a bare iframe: this composition must not fork. A YouTube lecture keeps
      // the same overlay, in the same place, on the same event.
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const { playerRef } = renderPlayer({
        lessonId,
        source: "https://www.youtube.com/embed/yY7RWGUbqng?si=nB8s",
      });
      await settle();
      emit(playerRef.current, "playing");

      const overlay = await screen.findByRole("dialog");
      expect(overlay).toHaveTextContent("03:00");
      expect(screen.getByRole("region")).toContainElement(overlay);
    });

    test("WHEN the overlay is open THEN the player's keyboard shortcuts are suppressed", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const { playerRef } = renderPlayer({ lessonId });
      await settle();
      emit(playerRef.current, "playing");
      await screen.findByRole("dialog");

      // Otherwise `Space` on the Resume button would both press it and toggle
      // playback underneath — design.md §D6.
      expect(playerRef.current?.$props.keyDisabled()).toBe(true);
    });

    test.each([
      ["nothing is stored", null],
      ["the position is trivial", "10"],
      ["the position is near the end", String(DURATION_SECONDS - 5)],
    ])("WHEN %s THEN no overlay appears", async (_case, stored) => {
      const lessonId = LessonId.parse(faker.string.uuid());
      if (stored !== null) mockStorage.set(storageKeyFor(lessonId), stored);

      const { playerRef } = renderPlayer({ lessonId });
      await settle();
      emit(playerRef.current, "playing");
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN the lesson has no known duration THEN no overlay appears", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const { playerRef } = renderPlayer({ lessonId, durationSeconds: 0 });
      await settle();
      emit(playerRef.current, "playing");
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("GIVEN the learner answers the overlay", () => {
    const openOverlay = async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockStorage.set(storageKeyFor(lessonId), String(RESUMABLE_SECONDS));

      const rendered = renderPlayer({ lessonId });
      await settle();
      emit(rendered.playerRef.current, "playing");
      await screen.findByRole("dialog");

      return rendered;
    };

    test.each(["resumeCta", "restartCta"])(
      "WHEN %s is activated THEN the overlay closes",
      async (action) => {
        const user = userEvent.setup();
        await openOverlay();

        await user.click(screen.getByRole("button", { name: action }));
        await settle();

        expect(screen.queryByRole("dialog")).toBeNull();
      },
    );

    test("WHEN Escape dismisses it THEN the overlay closes", async () => {
      const user = userEvent.setup();
      await openOverlay();

      await user.keyboard("{Escape}");
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    test("WHEN it is dismissed THEN nothing clears the stored position on the way out", async () => {
      const user = userEvent.setup();
      const { lessonId } = await openOverlay();

      await user.keyboard("{Escape}");
      await settle();

      // Dismissal issues no delete of its own. Playback then restarts from
      // the top and the ordinary cadence overwrites the value with where the
      // learner actually is — which a real browser does and jsdom cannot.
      expect(mockStorage.has(storageKeyFor(lessonId))).toBe(true);
    });

    test("WHEN it is answered THEN the player's keyboard shortcuts come back", async () => {
      const user = userEvent.setup();
      const { playerRef } = await openOverlay();

      await user.click(screen.getByRole("button", { name: "resumeCta" }));
      await settle();

      expect(playerRef.current?.$props.keyDisabled()).toBe(false);
    });

    test("WHEN playback begins again THEN the overlay is not offered twice", async () => {
      const user = userEvent.setup();
      const { playerRef } = await openOverlay();

      await user.click(screen.getByRole("button", { name: "resumeCta" }));
      await settle();
      emit(playerRef.current, "playing");
      await settle();

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("GIVEN the page wants to know playback has begun", () => {
    test("WHEN the player emits play THEN onPlaybackStart is called", async () => {
      const onPlaybackStart = vi.fn();
      const playerRef = { current: null as MediaPlayerInstance | null };

      render(
        <PlaybackPositionedVideoPlayer
          lessonId={LessonId.parse(faker.string.uuid())}
          source="/videos/lesson.mp4"
          title="t"
          durationSeconds={DURATION_SECONDS}
          onPlaybackStart={onPlaybackStart}
          ref={playerRef}
        />,
      );
      await settle();
      emit(playerRef.current, "play");

      expect(onPlaybackStart).toHaveBeenCalledTimes(1);
    });

    test("WHEN no callback is given THEN a play event does not throw", async () => {
      const { playerRef } = renderPlayer();
      await settle();

      expect(() => emit(playerRef.current, "play")).not.toThrow();
    });
  });

  describe("GIVEN the learner has watched some of the lesson", () => {
    test("WHEN they pause after playing THEN the position is persisted", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const { playerRef } = renderPlayer({ lessonId });
      await settle();

      emit(playerRef.current, "play");
      emit(playerRef.current, "pause");
      await settle();

      // The player reports 0 under jsdom, so this asserts *that* a write
      // happened once the gate opened, not which value — the value is
      // `usePersistPlaybackPosition`'s test.
      expect(mockStorage.has(storageKeyFor(lessonId))).toBe(true);
    });

    test("WHEN they pause without ever playing THEN nothing is persisted", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const { playerRef } = renderPlayer({ lessonId });
      await settle();

      emit(playerRef.current, "pause");
      await settle();

      expect(mockStorage.has(storageKeyFor(lessonId))).toBe(false);
    });
  });
});
