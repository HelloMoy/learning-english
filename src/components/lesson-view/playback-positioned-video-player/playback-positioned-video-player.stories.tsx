import { LessonId } from "@/domain/entities/ids/ids";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlaybackPositionedVideoPlayer } from "./playback-positioned-video-player";

/**
 * Each story owns a distinct lesson id so their `localStorage` entries never
 * collide, and a decorator seeds the saved position before the wrapper's
 * mount-read runs. That is the only way to drive this component from
 * Storybook — it reads persistence directly rather than taking the position
 * as a prop.
 */
const STORAGE_KEY_PREFIX = "learning-english:playback:";

const COLD_LESSON_ID = LessonId.parse("11111111-1111-4111-8111-111111111111");
const MID_LESSON_ID = LessonId.parse("22222222-2222-4222-8222-222222222222");
const NEAR_END_LESSON_ID = LessonId.parse("33333333-3333-4333-8333-333333333333");

const seedPosition = (lessonId: string, seconds: number | null) => {
  const key = `${STORAGE_KEY_PREFIX}${lessonId}`;
  if (seconds === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, String(seconds));
};

const meta = {
  title: "LessonView/PlaybackPositionedVideoPlayer",
  component: PlaybackPositionedVideoPlayer,
  args: {
    source: "/videos/vowels-short-vs-long.mp4",
    title: "Vowels: short vs. long",
    durationSeconds: 600,
  },
} satisfies Meta<typeof PlaybackPositionedVideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No saved position — the player renders bare, with no overlay. */
export const ColdLoad: Story = {
  args: { lessonId: COLD_LESSON_ID },
  decorators: [
    (Story) => {
      seedPosition(COLD_LESSON_ID, null);
      return <Story />;
    },
  ],
};

/** A mid-lecture position that passes both thresholds — overlay renders. */
export const WithResumablePosition: Story = {
  args: { lessonId: MID_LESSON_ID },
  decorators: [
    (Story) => {
      seedPosition(MID_LESSON_ID, 180);
      return <Story />;
    },
  ],
};

/** Within the last 10 seconds — treated as finished, so no overlay. */
export const NearCompletion: Story = {
  args: { lessonId: NEAR_END_LESSON_ID },
  decorators: [
    (Story) => {
      seedPosition(NEAR_END_LESSON_ID, 595);
      return <Story />;
    },
  ],
};
