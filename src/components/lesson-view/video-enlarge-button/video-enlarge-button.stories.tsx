import "@vidstack/react/player/styles/default/theme.css";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { VideoEnlargeButton } from "./video-enlarge-button";

/**
 * The button never appears on its own in the app — it sits at the right end of
 * the player's control bar. Every story therefore renders it against a dark
 * strip standing in for that bar, which is also the only place its glyph is
 * legible.
 */
const meta = {
  title: "LessonView/VideoEnlargeButton",
  component: VideoEnlargeButton,
  args: {
    isEnlarged: false,
    // The button is presentational; in the app this drives `useEnlargedVideo`.
    onToggle: () => {},
  },
  argTypes: {
    isEnlarged: { control: { type: "boolean" } },
  },
  decorators: [
    (Story) => (
      <div className="vds-video-layout flex w-full max-w-md items-center justify-end gap-1 rounded-lg bg-black/90 p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoEnlargeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The video is in the page: the control offers to enlarge it. */
export const InThePage: Story = {};

/** The video fills the viewport: the same control is the way back. */
export const Enlarged: Story = {
  args: { isEnlarged: true },
};

/**
 * The label is the player's own `enter-fullscreen` word, so it is already
 * translated everywhere. Hover the control to read it.
 */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** The same, in Portuguese — "Tela cheia". */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  args: { isEnlarged: true },
};
