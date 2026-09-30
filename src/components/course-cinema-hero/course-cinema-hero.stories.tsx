import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
  videoOf,
} from "../../../.storybook/fixtures/course-views";
import { CourseCinemaHero } from "./course-cinema-hero";

const RULE_3 = videoOf(ADVANCED_COURSE_VIEW, 5, 2);

/** Ana is six minutes into Rule 3 of the Advanced course, the last course she watched. */
const lastWatched = (() => {
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
        watchedAt: 0,
      }),
    ],
    completedIds: new Set(),
    positions,
  });
  return courseCardModel(shelf.featured!, {
    positions,
    claimedPrizes: new Set([ADVANCED_COURSE_VIEW.modules[0]!.slug]),
  });
})();

/** Enrolled in the Basic Course, not started. */
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

/** Enrolled in the Atlas of American Sounds, not started: reference material, not a level. */
const referenceCourse = (() => {
  const shelf = courseShelf({
    courses: [ATLAS_COURSE_VIEW],
    enrolledSlugs: new Set([ATLAS_COURSE_VIEW.course.slug]),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
  });
  return courseCardModel(shelf.featured!, { positions: new Map(), claimedPrizes: new Set() });
})();

const meta = {
  title: "Components/CourseCinemaHero",
  component: CourseCinemaHero,
  parameters: { layout: "padded" },
  args: { model: lastWatched, label: "last-watched" },
  argTypes: {
    label: {
      control: { type: "inline-radio" },
      options: ["last-watched", "your-course", "recommended"],
    },
  },
} satisfies Meta<typeof CourseCinemaHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The course watched last, with where to resume in the chip. */
export const LastWatched: Story = {};

/** The learner's only course, never opened: Next up and Start course. */
export const YourCourse: Story = {
  args: { model: notStarted, label: "your-course" },
};

/** A learner enrolled in nothing: the first course, recommended. */
export const Recommended: Story = {
  args: { model: notStarted, label: "recommended" },
};

/** A reference course: its facts read Reference instead of a level. */
export const ReferenceCourse: Story = {
  args: { model: referenceCourse, label: "your-course" },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
