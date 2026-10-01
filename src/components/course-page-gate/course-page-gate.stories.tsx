import { CourseDetailView } from "@/components/course-detail-view/course-detail-view";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CoursePageGate } from "./course-page-gate";

const { course } = BASIC_COURSE_VIEW;

const meta = {
  title: "Components/CoursePageGate",
  component: CoursePageGate,
  parameters: { layout: "fullscreen" },
  args: {
    title: course.title,
    children: <CourseDetailView view={BASIC_COURSE_VIEW} />,
  },
  beforeEach: () => {
    resetLearnerStore();
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CoursePageGate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before the learner's state is known: only the title, over placeholders. */
export const Pending: Story = {};

/** An enrolled learner on the course page's own route: the page, in its enrolled state. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([course.slug]);
  },
};

/** A learner who has not joined: the page, offering Enroll. */
export const NotEnrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([]);
  },
};
