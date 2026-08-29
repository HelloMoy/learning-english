import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonVideoResume } from "./lesson-video-resume";

const noop = () => undefined;
const resumeAt = (seconds: number) => () => seconds;

const meta = {
  title: "LessonView/LessonVideoResume",
  component: LessonVideoResume,
} satisfies Meta<typeof LessonVideoResume>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidLecture: Story = {
  args: {
    positionSeconds: 180,
    durationSeconds: 600,
    onResume: resumeAt(180),
    onRestart: noop,
  },
};

export const LongLesson: Story = {
  args: {
    positionSeconds: 1450,
    durationSeconds: 3600,
    onResume: resumeAt(1450),
    onRestart: noop,
  },
};

export const NotRenderedBelowThreshold: Story = {
  args: {
    positionSeconds: 5,
    durationSeconds: 600,
    onResume: resumeAt(5),
    onRestart: noop,
  },
};

export const NotRenderedNearCompletion: Story = {
  args: {
    positionSeconds: 595,
    durationSeconds: 600,
    onResume: resumeAt(595),
    onRestart: noop,
  },
};
