import "@testing-library/jest-dom/vitest";

import { SEEK_RUN_WINDOW_MS, SEEK_STEP_SECONDS } from "@/lib/seek-run/seek-run";

import { faker } from "@faker-js/faker";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useMediaRemote, type MediaPlayerInstance } from "@vidstack/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LessonVideoPlayer } from "./lesson-video-player";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

/**
 * Only the remote is replaced. jsdom never reaches `can-play`, and Vidstack
 * holds every seek request behind that gate, so the one way to see what the
 * run asked for is the call it makes. Everything else — the player, the
 * provider, the gestures and their press counting — is the real library.
 */
vi.mock("@vidstack/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vidstack/react")>()),
  useMediaRemote: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUseTheme = vi.mocked(useTheme);
const mockUseMediaRemote = vi.mocked(useMediaRemote);

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
    mockUseMediaRemote.mockReturnValue({ seek: vi.fn() } as never);
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

  describe("GIVEN a learner who wants the video bigger", () => {
    /*
     * The enlarge control lives in the Default Layout's `fullscreenButton`
     * slot, and that layout renders no controls at all here — jsdom never
     * fires the `IntersectionObserver` the player defers loading behind, so
     * `.vds-video-layout` stays empty and the slot never mounts. Whether the
     * control is present, pins the player, and survives the toggle without
     * being replaced is therefore asserted in `e2e/lesson-video-player.spec.ts`,
     * against a browser that really lays the chrome out.
     *
     * What is testable here is the collapsed box the player presents to the
     * page, which is the shape the rest of the lesson layout is built on.
     */
    test("WHEN the video is in the page THEN the player is a full-width 16:9 box", () => {
      renderPlayer();

      expect(screen.getByRole("region")).toHaveClass("aspect-video", "w-full");
      expect(screen.getByRole("region")).not.toHaveClass("fixed");
    });

    test("WHEN the video is in the page THEN no swipe-up hint is drawn over it", () => {
      // The hint only makes sense while the player is pinned to the viewport
      // and the browser's toolbar is still on screen; in the page it would be
      // noise over the video.
      renderPlayer();

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
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

  describe("GIVEN a learner who taps the video", () => {
    /*
     * The gestures are the player's own children, not part of the Default
     * Layout, so unlike the layout's chrome they mount under jsdom (`Poster`
     * does too). What they *do* to playback is Playwright's to prove; what is
     * observable here is the contract: which gestures exist and which do not.
     */
    const gesturesIn = (player: HTMLElement) =>
      Array.from(player.querySelectorAll("[data-media-gesture]")).map((gesture) => ({
        event: gesture.getAttribute("event"),
        action: gesture.getAttribute("action"),
      }));

    test("WHEN rendered THEN a single tap toggles playback", () => {
      renderPlayer();

      expect(gesturesIn(screen.getByRole("region"))).toContainEqual({
        event: "pointerup",
        action: "toggle:paused",
      });
    });

    test("WHEN rendered THEN no gesture merely reveals the controls", () => {
      // On a touch device Vidstack's own set swaps play/pause for show/hide
      // controls, which is what left YouTube's centre icon dead on iPhone.
      renderPlayer();

      expect(gesturesIn(screen.getByRole("region")).map((gesture) => gesture.action)).not.toContain(
        "toggle:controls",
      );
    });

    test("WHEN rendered THEN no seek indicator is drawn", () => {
      renderPlayer();

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    test("WHEN rendered THEN a double tap still seeks and toggles fullscreen", () => {
      // The seek actions spell the step from the constant, so a change there
      // reaches the gestures without a second edit.
      renderPlayer();

      expect(gesturesIn(screen.getByRole("region"))).toEqual(
        expect.arrayContaining([
          { event: "dblpointerup", action: "toggle:fullscreen" },
          { event: "dblpointerup", action: `seek:-${SEEK_STEP_SECONDS}` },
          { event: "dblpointerup", action: `seek:${SEEK_STEP_SECONDS}` },
        ]),
      );
    });
  });

  describe("GIVEN a learner who double-taps an edge", () => {
    /*
     * The whole path is exercised through the real library: two pointer-ups
     * on the provider within Vidstack's double-tap window trigger its seek
     * gesture, which hands the tap to the run. Under jsdom no element has a
     * box, so the two seek zones are given one here — a tap outside both
     * meets no gesture at all, which is exactly the "middle band".
     *
     * A single tap's `toggle:paused` is the one action jsdom lets through:
     * Vidstack dispatches a play request at once while the player cannot
     * load. So "the gestures are disabled during a run" is observed as the
     * absence of that request, and its presence outside a run proves the
     * observation means something.
     */
    const ZONE = { top: 0, bottom: 100, height: 100 };
    const WHOLE_BOX = { ...ZONE, left: 0, right: 1000, width: 1000, x: 0, y: 0 };
    const BACKWARD_ZONE = { ...ZONE, left: 0, right: 200, width: 200, x: 0, y: 0 };
    const FORWARD_ZONE = { ...ZONE, left: 800, right: 1000, width: 200, x: 800, y: 0 };
    const IN_BACKWARD_ZONE = 100;
    const IN_FORWARD_ZONE = 900;
    const IN_THE_MIDDLE = 500;
    const DOUBLE_TAP_GAP_MS = 100;
    const SINGLE_TAP_SETTLE_MS = 300;

    let seekRequests: ReturnType<typeof vi.fn>;
    const seek = () => seekRequests;

    function renderPlayerWithSeekZones() {
      const ref = createRef<MediaPlayerInstance>();
      const view = renderPlayer({}, ref);
      const player = screen.getByRole("region");
      const giveBox = (action: string, box: typeof WHOLE_BOX) => {
        const zone = player.querySelector(
          `[data-media-gesture][action="${action}"]`,
        ) as HTMLElement;
        zone.getBoundingClientRect = () => ({ ...box, toJSON: () => box });
      };
      // The fullscreen gesture keeps jsdom's empty box on purpose: without
      // the stylesheet's `z-index` the library breaks a tie between two
      // triggered gestures by document order, and it comes before the seek
      // zones. Fullscreen is not under test here.
      giveBox("toggle:paused", WHOLE_BOX);
      giveBox(`seek:-${SEEK_STEP_SECONDS}`, BACKWARD_ZONE);
      giveBox(`seek:${SEEK_STEP_SECONDS}`, FORWARD_ZONE);
      const provider = player.querySelector("[data-media-provider]") as HTMLElement;
      const playRequests = vi.fn();
      player.addEventListener("media-play-request", playRequests);
      // Vidstack connects its components on a zero-delay timeout, and only a
      // connected gesture listens on the provider. With the clock faked that
      // timeout waits for us.
      act(() => {
        vi.runOnlyPendingTimers();
      });
      return { ...view, player, provider, playRequests };
    }

    function tapAt(provider: HTMLElement, clientX: number, button = 0) {
      fireEvent.pointerUp(provider, { clientX, clientY: 50, button });
    }

    /** Lets Vidstack's microtask and animation frame run the triggered gesture. */
    async function settleGesture() {
      await act(async () => {
        await Promise.resolve();
        vi.advanceTimersByTime(20);
      });
    }

    async function doubleTapAt(provider: HTMLElement, clientX: number) {
      tapAt(provider, clientX);
      await act(async () => {
        vi.advanceTimersByTime(DOUBLE_TAP_GAP_MS);
      });
      tapAt(provider, clientX);
      await settleGesture();
    }

    async function letSingleTapSettle() {
      await act(async () => {
        vi.advanceTimersByTime(SINGLE_TAP_SETTLE_MS);
      });
      await settleGesture();
    }

    beforeEach(() => {
      vi.useFakeTimers({
        toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
      });
      mockUseTranslations.mockReturnValue(((key: string, values?: { count: number }) =>
        values === undefined ? key : `${key}:${values.count}`) as never);
      seekRequests = vi.fn();
      mockUseMediaRemote.mockReturnValue({ seek: seekRequests } as never);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("WHEN the harness taps the middle once THEN the library requests playback", async () => {
      // The control for the disabled-gesture assertions below.
      const { provider, playRequests } = renderPlayerWithSeekZones();

      tapAt(provider, IN_THE_MIDDLE);
      await letSingleTapSettle();

      expect(playRequests).toHaveBeenCalledTimes(1);
    });

    test("WHEN the right edge is double-tapped THEN the video is asked for one step forward", async () => {
      const { provider } = renderPlayerWithSeekZones();

      await doubleTapAt(provider, IN_FORWARD_ZONE);

      expect(seek()).toHaveBeenCalledTimes(1);
      expect(seek()).toHaveBeenCalledWith(SEEK_STEP_SECONDS, expect.anything());
    });

    test("WHEN the right edge is double-tapped THEN the indicator shows one step forward", async () => {
      const { provider } = renderPlayerWithSeekZones();

      await doubleTapAt(provider, IN_FORWARD_ZONE);

      expect(screen.getByRole("status")).toHaveAttribute("data-direction", "forward");
      expect(screen.getByRole("status")).toHaveTextContent(`seconds:${SEEK_STEP_SECONDS}`);
    });

    test("WHEN the left edge is double-tapped THEN the video is asked for one step back", async () => {
      const { provider } = renderPlayerWithSeekZones();

      await doubleTapAt(provider, IN_BACKWARD_ZONE);

      expect(seek()).toHaveBeenCalledWith(-SEEK_STEP_SECONDS, expect.anything());
      expect(screen.getByRole("status")).toHaveAttribute("data-direction", "backward");
    });

    test("WHEN a third tap lands on the same edge THEN another step is added from the anchor", async () => {
      const { provider } = renderPlayerWithSeekZones();
      await doubleTapAt(provider, IN_FORWARD_ZONE);

      tapAt(provider, IN_FORWARD_ZONE);

      expect(seek()).toHaveBeenLastCalledWith(2 * SEEK_STEP_SECONDS, expect.anything());
      expect(screen.getByRole("status")).toHaveTextContent(`seconds:${2 * SEEK_STEP_SECONDS}`);
    });

    test("WHEN a tap lands on the other edge THEN the run turns around from where it was heading", async () => {
      const { provider } = renderPlayerWithSeekZones();
      await doubleTapAt(provider, IN_FORWARD_ZONE);
      tapAt(provider, IN_FORWARD_ZONE);

      tapAt(provider, IN_BACKWARD_ZONE);

      expect(seek()).toHaveBeenLastCalledWith(SEEK_STEP_SECONDS, expect.anything());
      expect(screen.getByRole("status")).toHaveAttribute("data-direction", "backward");
      expect(screen.getByRole("status")).toHaveTextContent(`seconds:${SEEK_STEP_SECONDS}`);
    });

    test("WHEN a tap lands in the middle during a run THEN nothing seeks and nothing plays", async () => {
      const { provider, playRequests } = renderPlayerWithSeekZones();
      await doubleTapAt(provider, IN_FORWARD_ZONE);

      tapAt(provider, IN_THE_MIDDLE);
      await letSingleTapSettle();

      expect(seek()).toHaveBeenCalledTimes(1);
      expect(playRequests).not.toHaveBeenCalled();
    });

    test("WHEN a non-primary button lands on an edge during a run THEN it is ignored", async () => {
      const { provider } = renderPlayerWithSeekZones();
      await doubleTapAt(provider, IN_FORWARD_ZONE);

      tapAt(provider, IN_FORWARD_ZONE, 2);

      expect(seek()).toHaveBeenCalledTimes(1);
    });

    test("WHEN the taps stop THEN the indicator leaves after the window", async () => {
      const { provider } = renderPlayerWithSeekZones();
      await doubleTapAt(provider, IN_FORWARD_ZONE);

      await act(async () => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS);
      });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    test("WHEN the run has ended THEN a single tap requests playback again", async () => {
      const { provider, playRequests } = renderPlayerWithSeekZones();
      await doubleTapAt(provider, IN_FORWARD_ZONE);
      await act(async () => {
        vi.advanceTimersByTime(SEEK_RUN_WINDOW_MS);
      });

      tapAt(provider, IN_THE_MIDDLE);
      await letSingleTapSettle();

      expect(playRequests).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN the player's chrome must be localized", () => {
    test("WHEN rendered THEN every layout word is read from the VideoPlayer namespace", () => {
      renderPlayer();

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.VideoPlayer");
    });
  });
});
