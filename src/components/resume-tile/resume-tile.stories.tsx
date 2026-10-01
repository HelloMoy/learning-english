import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  BASIC_COURSE_VIEW,
  videoOf,
} from "../../../.storybook/fixtures/course-views";
import { ResumeTile } from "./resume-tile";

const DAY_MS = 24 * 60 * 60 * 1000;
const RULE_3 = videoOf(ADVANCED_COURSE_VIEW, 5, 2);

/** Six minutes into Rule 3 of the Advanced course, watched yesterday. */
const midVideo = (() => {
  const positions = new Map([[RULE_3.id, 365]]);
  const shelf = courseShelf({
    courses: [ADVANCED_COURSE_VIEW],
    enrolledSlugs: new Set([ADVANCED_COURSE_VIEW.course.slug]),
    records: [
      ContinueWatchingRecord.parse({
        location: {
          courseSlug: ADVANCED_COURSE_VIEW.course.slug,
          moduleSlug: ADVANCED_COURSE_VIEW.modules[5]!.slug,
          lessonId: RULE_3.id,
        },
        watchedAt: Date.now() - DAY_MS,
      }),
    ],
    completedIds: new Set(),
    positions,
  });
  return courseCardModel(shelf.featured!, { positions, claimedPrizes: new Set() });
})();

/** Enrolled in the Basic Course and not started. */
const notStarted = (() => {
  const shelf = courseShelf({
    courses: [BASIC_COURSE_VIEW],
    enrolledSlugs: new Set([BASIC_COURSE_VIEW.course.slug]),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
  });
  return courseCardModel(shelf.featured!, { positions: new Map(), claimedPrizes: new Set() });
})();

const meta = {
  title: "Components/ResumeTile",
  component: ResumeTile,
  parameters: { layout: "padded" },
  args: { reading: { status: "read", model: midVideo } },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResumeTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Part-way through a video: progress, elapsed time and when it was watched. */
export const MidVideo: Story = {};

/** A course never opened: Start here and Start. */
export const NotStarted: Story = {
  args: { reading: { status: "read", model: notStarted } },
};

/** Before the learner's state is read: placeholders naming no lesson. */
export const Pending: Story = {
  args: { reading: { status: "pending" } },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
