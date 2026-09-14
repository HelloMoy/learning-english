import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import "../lesson-video-player/lesson-video-player.css";

import { VideoCenterPlayButton } from "./video-center-play-button";

/**
 * The play/pause control a touch device gets at the centre of the frame.
 *
 * It reads everything it decides on from the player — the pointer type, the
 * control bar's visibility, the player's width — so every story stands up a
 * real player in its full chrome rather than faking the context. **It only
 * draws on a coarse pointer:** open the story in a touch emulator (the
 * browser's device toolbar), then tap the frame to bring the controls in.
 * With a mouse the control correctly stays away.
 */
const meta = {
  title: "LessonView/VideoCenterPlayButton",
  component: VideoCenterPlayButton,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-black p-6">
        <MediaPlayer
          className="mx-auto aspect-video w-full max-w-3xl bg-black"
          src="/videos/vowels-short-vs-long.mp4"
          title="Vowels: short vs. long"
          viewType="video"
          playsInline
        >
          <MediaProvider />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme="dark"
            smallLayoutWhen={false}
          />
          <Story />
        </MediaPlayer>
      </div>
    ),
  ],
} satisfies Meta<typeof VideoCenterPlayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Paused before the first play: the control offers to play. */
export const Default: Story = {};

/** The label is the player's own `play` / `pause` word — "Reproducir". */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** The same in Portuguese — "Reproduzir". */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
