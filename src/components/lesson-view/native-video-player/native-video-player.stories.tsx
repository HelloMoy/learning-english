import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NativeVideoPlayer } from "./native-video-player";

const meta = {
  title: "LessonView/NativeVideoPlayer",
  component: NativeVideoPlayer,
} satisfies Meta<typeof NativeVideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPoster: Story = {
  args: {
    source: "/videos/vowels-short-vs-long.mp4",
    poster: "/thumbnails/vowels-short-vs-long.jpg",
    title: "Vowels: short vs. long",
  },
};

export const WithoutPoster: Story = {
  args: {
    source: "/videos/vowels-short-vs-long.mp4",
    title: "Vowels: short vs. long",
  },
};
