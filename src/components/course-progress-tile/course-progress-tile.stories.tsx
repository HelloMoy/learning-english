import { Course } from "@/domain/entities/course/course";
import { CourseId } from "@/domain/entities/ids/ids";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseProgressTile } from "./course-progress-tile";

const course = Course.parse({
  id: CourseId.parse("5b0c4a7e-1f3d-4c1e-9a55-0c8a1e2f3b4d"),
  slug: "basic-course",
  title: "Basic Course",
  description: "The sounds of American English.",
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
  sequence: 1,
});

const meta = {
  title: "Components/CourseProgressTile",
  component: CourseProgressTile,
  decorators: [
    (Story) => (
      <div style={{ width: 380 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    course,
    reading: {
      status: "read",
      tally: {
        completedCount: 2,
        lessonCount: 48,
        completedFraction: 2 / 48,
        secondsLeft: 607 * 60,
      },
    },
  },
} satisfies Meta<typeof CourseProgressTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two of 48 videos watched: 4 % and ten hours left. */
export const PartWay: Story = {};

/** The whole course watched. */
export const Finished: Story = {
  args: {
    reading: {
      status: "read",
      tally: { completedCount: 48, lessonCount: 48, completedFraction: 1, secondsLeft: 0 },
    },
  },
};

/** Before progress is read: the course title and an empty ring. */
export const Pending: Story = {
  args: { reading: { status: "pending" } },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
