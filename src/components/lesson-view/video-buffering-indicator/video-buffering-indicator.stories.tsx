import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "../lesson-video-player/lesson-video-player.css";

import { VideoBufferingIndicator } from "./video-buffering-indicator";

/** A poster the idle story can show the indicator staying away from. */
const SAMPLE_POSTER = "https://files.vidstack.io/sprite-fight/poster.webp";

/**
 * The buffering indicator in its real home: the Default Layout's
 * `bufferingIndicator` slot, inside a player. It follows the player's
 * `data-buffering` attribute, so each story puts the player in the state it
 * wants to show rather than faking the picture.
 */
const meta = {
  title: "LessonView/VideoBufferingIndicator",
  component: VideoBufferingIndicator,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof VideoBufferingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Waiting for media. The source never arrives, and the player is told to load
 * eagerly, so it sits in `data-buffering` for as long as the story is open:
 * the brand-coloured ring around an opaque black core, the core being what
 * hides the YouTube embed's own spinner in a real lesson.
 */
export const Buffering: Story = {
  render: () => (
    <div className="min-h-svh bg-black p-6">
      <MediaPlayer
        className="mx-auto aspect-video w-full max-w-3xl bg-black"
        src="/videos/a-lesson-that-never-arrives.mp4"
        title="A lesson that is still loading"
        viewType="video"
        load="eager"
        playsInline
      >
        <MediaProvider />
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          colorScheme="dark"
          smallLayoutWhen={false}
          slots={{ bufferingIndicator: <VideoBufferingIndicator /> }}
        />
      </MediaPlayer>
    </div>
  ),
};

/**
 * Not waiting. Over a poster the player can show, neither the ring nor the
 * core is visible — the indicator is in the tree and paints nothing.
 */
export const Idle: Story = {
  render: () => (
    <div className="min-h-svh bg-black p-6">
      <MediaPlayer
        className="mx-auto aspect-video w-full max-w-3xl bg-black"
        src="https://files.vidstack.io/sprite-fight/720p.mp4"
        poster={SAMPLE_POSTER}
        title="A lesson that is ready"
        viewType="video"
        load="eager"
        playsInline
      >
        <MediaProvider />
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          colorScheme="dark"
          smallLayoutWhen={false}
          slots={{ bufferingIndicator: <VideoBufferingIndicator /> }}
        />
      </MediaPlayer>
    </div>
  ),
};
