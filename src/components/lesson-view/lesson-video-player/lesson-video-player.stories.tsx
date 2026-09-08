import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonVideoResumeOverlay } from "../lesson-video-resume-overlay/lesson-video-resume-overlay";
import { LessonVideoPlayer } from "./lesson-video-player";

/**
 * A short, freely-licensed clip so the chrome has real duration, real frames,
 * and a real scrubber to drag. Nothing in the component depends on it.
 */
const SAMPLE_SOURCE = "https://files.vidstack.io/sprite-fight/720p.mp4";
const SAMPLE_POSTER = "https://files.vidstack.io/sprite-fight/poster.webp";

const meta = {
  title: "LessonView/LessonVideoPlayer",
  component: LessonVideoPlayer,
  parameters: { layout: "padded" },
  args: {
    source: SAMPLE_SOURCE,
    title: "Long vs short vowels",
    ariaLabel: "Lecture video player",
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LessonVideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A poster-less lesson — the idle frame is black until playback starts. */
export const Default: Story = {};

/** With a thumbnail, which is what most lessons in the catalog have. */
export const WithPoster: Story = {
  args: { poster: SAMPLE_POSTER },
};

/**
 * The layout's controls in Spanish. Every label, tooltip, and menu entry comes
 * from `Components.VideoPlayer` — hover a control to check its tooltip.
 */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: { poster: SAMPLE_POSTER },
};

/**
 * The resume overlay in its real home: a child of the player, covering the
 * video frame and nothing else. `keyDisabled` is what the wrapper sets while
 * the overlay is up, so `Space` reaches the buttons instead of toggling play.
 */
export const WithResumeOverlay: Story = {
  args: {
    poster: SAMPLE_POSTER,
    keyDisabled: true,
    children: (
      <LessonVideoResumeOverlay
        positionSeconds={57}
        onResume={() => {}}
        onRestart={() => {}}
      />
    ),
  },
};
