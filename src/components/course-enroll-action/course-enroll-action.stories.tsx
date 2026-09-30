import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ADVANCED_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CourseEnrollAction } from "./course-enroll-action";

const meta = {
  title: "Components/CourseEnrollAction",
  component: CourseEnrollAction,
  parameters: { layout: "centered" },
  args: { view: ADVANCED_COURSE_VIEW },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([]);
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CourseEnrollAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Not joined yet: Enroll. Activating it turns the action into Start course. */
export const NotEnrolled: Story = {};

/** Joined: Start course opens the first video. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([ADVANCED_COURSE_VIEW.course.slug]);
  },
};

/** Stretched to fill a card or bar. */
export const FullWidth: Story = {
  args: { className: "w-80" },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
