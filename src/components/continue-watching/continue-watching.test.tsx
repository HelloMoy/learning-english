import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

import { render, screen, waitFor } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ContinueWatching } from "./continue-watching";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const msg = (namespace: string, key: string, values?: Record<string, unknown>) =>
  values ? `${namespace}.${key}:${JSON.stringify(values)}` : `${namespace}.${key}`;

const panelMsg = (key: string, values?: Record<string, unknown>) =>
  msg("Components.ContinueWatching", key, values);

const LESSON_ID = "33333333-3333-4333-8333-333333333333";

const location = ContinueWatchingLocation.parse({
  courseSlug: "english-a1-pronunciation",
  moduleSlug: "vowels-and-video-intro",
  lessonId: LESSON_ID,
});

const videoPanel: ContinueWatchingPanel = {
  courseTitle: "Basic — Foundational Pronunciation",
  moduleTitle: "Vowels and video intro",
  lessonTitle: "Vowels: short vs. long",
  lessonHref:
    "/courses/english-a1-pronunciation/modules/vowels-and-video-intro/lessons/" + LESSON_ID,
  durationSeconds: 600,
};

const makeLocations = (stored: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => stored,
  set: async () => {},
});

const makePositions = (seconds: number | null): PlaybackPositionRepository => ({
  getPosition: async () => seconds,
  setPosition: async () => {},
});

const renderPanel = (options?: {
  stored?: ContinueWatchingLocation | null;
  panel?: ContinueWatchingPanel | null;
  seconds?: number | null;
  resolve?: (input: ContinueWatchingLocation) => Promise<ContinueWatchingPanel | null>;
}) =>
  render(
    <ContinueWatching
      resolve={
        options?.resolve ??
        (async () => (options?.panel === undefined ? videoPanel : options.panel))
      }
      continueWatching={makeLocations(options?.stored === undefined ? location : options.stored)}
      positions={makePositions(options?.seconds === undefined ? 247 : options.seconds)}
    />,
  );

describe("ContinueWatching", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      ((namespace: string) => (key: string, values?: Record<string, unknown>) =>
        msg(namespace, key, values)) as never,
    );
  });

  describe("GIVEN nothing has been watched", () => {
    test("WHEN no location is stored THEN nothing renders", async () => {
      renderPanel({ stored: null });
      await waitFor(() => {
        expect(screen.queryByTestId("continue-watching")).toBeNull();
      });
    });

    test("WHEN no location is stored THEN the resolver is never called", async () => {
      const resolve = vi.fn(async () => videoPanel);
      renderPanel({ stored: null, resolve });
      await waitFor(() => {
        expect(screen.queryByTestId("continue-watching")).toBeNull();
      });
      expect(resolve).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a stored location that no longer resolves", () => {
    test("WHEN the resolver reports nothing THEN nothing renders, and no error is shown", async () => {
      renderPanel({ panel: null });
      await waitFor(() => {
        expect(screen.queryByTestId("continue-watching")).toBeNull();
      });
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("GIVEN a stored location that resolves to a video lesson", () => {
    test("WHEN resolved THEN it names the lesson and its place in the course", async () => {
      renderPanel();
      expect(await screen.findByTestId("continue-watching")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: videoPanel.lessonTitle })).toBeInTheDocument();
      expect(screen.getByTestId("continue-watching-breadcrumb")).toHaveTextContent(
        panelMsg("breadcrumb", {
          course: videoPanel.courseTitle,
          module: videoPanel.moduleTitle,
        }),
      );
    });

    test("WHEN resolved THEN the primary action links to that lesson", async () => {
      renderPanel();
      const resume = await screen.findByTestId("continue-watching-resume");
      expect(resume).toHaveTextContent(panelMsg("resume"));
      expect(resume).toHaveAttribute("href", videoPanel.lessonHref);
    });

    test("WHEN a playback position is saved THEN it reports how much is left", async () => {
      // 247s watched of 600s: 353s remain, and the bar fills to 41%.
      renderPanel({ seconds: 247 });
      const remaining = await screen.findByTestId("continue-watching-remaining");
      expect(remaining).toHaveTextContent(
        panelMsg("remaining", { remaining: "05:53", total: "10:00" }),
      );
      expect(screen.getByTestId("continue-watching-progress")).toHaveAttribute(
        "aria-valuenow",
        "41",
      );
    });

    test("WHEN no playback position is saved THEN the progress indicator is omitted", async () => {
      // Rendering a bar at zero would claim the learner started the video.
      renderPanel({ seconds: null });
      // Awaits the action link, which settles in the same chain the bar
      // would, so "still absent" is a real observation rather than a race.
      await screen.findByTestId("continue-watching-resume");
      expect(screen.queryByTestId("continue-watching-progress")).toBeNull();
      expect(screen.queryByTestId("continue-watching-remaining")).toBeNull();
    });

    test("WHEN the saved position runs past the duration THEN the bar does not overflow", async () => {
      // The bar resolves one tick after the panel — the location, the panel
      // copy and the saved position each settle in turn — so this awaits the
      // bar itself rather than the panel that precedes it.
      renderPanel({ seconds: 900 });
      expect(await screen.findByTestId("continue-watching-progress")).toHaveAttribute(
        "aria-valuenow",
        "100",
      );
    });
  });

  describe("GIVEN a stored location that resolves to a reading lesson", () => {
    test("WHEN resolved THEN it offers the lesson without a progress indicator", async () => {
      renderPanel({
        panel: { ...videoPanel, durationSeconds: null, lessonTitle: "Drills: minimal pairs" },
      });
      expect(await screen.findByTestId("continue-watching")).toBeInTheDocument();
      expect(screen.getByTestId("continue-watching-resume")).toBeInTheDocument();
      expect(screen.queryByTestId("continue-watching-progress")).toBeNull();
    });
  });

  describe("GIVEN the server render, before storage can be read", () => {
    test("WHEN first painted THEN the panel is absent", () => {
      renderPanel();
      expect(screen.queryByTestId("continue-watching")).toBeNull();
    });
  });
});
