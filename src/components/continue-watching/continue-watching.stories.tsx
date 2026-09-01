import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ContinueWatching } from "./continue-watching";

const LESSON_ID = "22222222-2222-4222-8222-222222222220";

const location = ContinueWatchingLocation.parse({
  courseSlug: "english-a1-pronunciation",
  moduleSlug: "vowels-and-video-intro",
  lessonId: LESSON_ID,
});

const videoPanel: ContinueWatchingPanel = {
  courseTitle: "Basic — Foundational Pronunciation",
  moduleTitle: "Vowels and video intro",
  lessonTitle: "Vowels: short vs. long",
  lessonHref: `/courses/english-a1-pronunciation/modules/vowels-and-video-intro/lessons/${LESSON_ID}`,
  durationSeconds: 600,
};

const storedAt = (stored: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => stored,
  set: async () => {},
});

const watchedFor = (seconds: number | null): PlaybackPositionRepository => ({
  getPosition: async () => seconds,
  setPosition: async () => {},
});

const meta: Meta<typeof ContinueWatching> = {
  title: "Cinema/ContinueWatching",
  component: ContinueWatching,
  args: {
    resolve: async () => videoPanel,
    continueWatching: storedAt(location),
    positions: watchedFor(247),
  },
};

export default meta;
type Story = StoryObj<typeof ContinueWatching>;

/** A video lesson left part-way through: the bar and the remaining clock. */
export const PartWayThroughAVideo: Story = {};

/**
 * A video the learner opened but never played. No position is saved, so the
 * bar is omitted rather than drawn at zero — which would claim they started.
 */
export const OpenedButNotStarted: Story = {
  args: { positions: watchedFor(null) },
};

/** A reading lesson: nothing to measure, so the panel offers the link alone. */
export const ReadingLesson: Story = {
  args: {
    resolve: async () => ({
      ...videoPanel,
      lessonTitle: "Drills: minimal pairs",
      durationSeconds: null,
    }),
  },
};

/**
 * Nothing recorded yet. The panel renders nothing at all — a learner who has
 * watched nothing has done nothing wrong, and the ladder below reaches every
 * course without it.
 */
export const NothingToContinue: Story = {
  args: { continueWatching: storedAt(null) },
};

/**
 * A record pointing at a lesson that has since been removed. Same silence as
 * an empty store: never an error surface.
 */
export const StaleRecord: Story = {
  args: { resolve: async () => null },
};
