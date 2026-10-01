import { Course } from "@/domain/entities/course/course";
import { CourseId } from "@/domain/entities/ids/ids";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { CourseProgressTile, type CourseProgressTileProps } from "./course-progress-tile";

const course = Course.parse({
  id: CourseId.parse("5b0c4a7e-1f3d-4c1e-9a55-0c8a1e2f3b4d"),
  slug: "basic-course",
  title: "Basic Course",
  description: "The sounds of American English.",
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
  track: "level",
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

/** The course's five prizes, one of them claimed: the rest stay silhouettes. */
export const WithPrizes: Story = {
  args: {
    prizes: [
      { prize: "whistle", isClaimed: true },
      { prize: "harmonica", isClaimed: false },
      { prize: "megaphone", isClaimed: false },
      { prize: "drum", isClaimed: false },
      { prize: "car", isClaimed: false },
    ],
  },
};

/** Every prize claimed — what the counter looks like from here once it is emptied. */
export const EveryPrizeClaimed: Story = {
  args: {
    reading: {
      status: "read",
      tally: { completedCount: 48, lessonCount: 48, completedFraction: 1, secondsLeft: 0 },
    },
    prizes: [
      { prize: "whistle", isClaimed: true },
      { prize: "harmonica", isClaimed: true },
      { prize: "megaphone", isClaimed: true },
      { prize: "drum", isClaimed: true },
      { prize: "car", isClaimed: true },
    ],
  },
};

/** The tile with a closing link whose label is read from the shipped messages, as callers do. */
function LinkedTile({
  labelKey,
  href,
  ...props
}: CourseProgressTileProps & { labelKey: "viewCourse" | "viewCourseDetails"; href: string }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <CourseProgressTile
      {...props}
      link={{ href, label: t(labelKey) }}
    />
  );
}

/** As the progress board shows it: the title and View course details lead to the course page. */
export const OnTheBoard: Story = {
  render: (args) => (
    <LinkedTile
      {...args}
      labelKey="viewCourseDetails"
      href="/courses/basic-course/about"
    />
  ),
};

/** As My learning shows it: a level-two title and a View course link to the overview. */
export const OnMyLearning: Story = {
  render: (args) => (
    <LinkedTile
      {...args}
      labelKey="viewCourse"
      href="/courses/basic-course"
    />
  ),
  args: {
    headingLevel: 2,
    prizes: [
      { prize: "whistle", isClaimed: true },
      { prize: "harmonica", isClaimed: false },
      { prize: "megaphone", isClaimed: false },
    ],
  },
};

/** Before progress is read: the course title and an empty ring, and no prize figures. */
export const Pending: Story = {
  args: { reading: { status: "pending" } },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
