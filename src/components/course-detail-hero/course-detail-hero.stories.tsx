import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
} from "../../../.storybook/fixtures/course-views";
import { CourseDetailHero } from "./course-detail-hero";

const meta = {
  title: "Components/CourseDetailHero",
  component: CourseDetailHero,
  parameters: { layout: "padded" },
  args: { view: BASIC_COURSE_VIEW },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([]);
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CourseDetailHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course before joining: Level 1, the Introduction chip, five prize silhouettes and Enroll. */
export const BasicCourse: Story = {};

/** The Advanced Intermediate Course: Level 2, ten prizes. */
export const AdvancedCourse: Story = {
  args: { view: ADVANCED_COURSE_VIEW },
};

/** The Atlas of American Sounds: the mark and facts line read Reference. */
export const ReferenceCourse: Story = {
  args: { view: ATLAS_COURSE_VIEW },
};

/** Right after enrolling from the page: the mark reads Enrolled and the action Start course. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug]);
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
