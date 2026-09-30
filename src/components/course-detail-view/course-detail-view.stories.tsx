import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
} from "../../../.storybook/fixtures/course-views";
import { CourseDetailView } from "./course-detail-view";

const meta = {
  title: "Components/CourseDetailView",
  component: CourseDetailView,
  parameters: { layout: "fullscreen" },
  args: { view: BASIC_COURSE_VIEW },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([]);
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CourseDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course before joining: outcomes, 41 sounds, five lessons and the enroll card. */
export const BasicCourse: Story = {};

/** The Advanced Intermediate Course declares no sounds, so that section is absent. */
export const AdvancedCourse: Story = {
  args: { view: ADVANCED_COURSE_VIEW },
};

/** The Atlas of American Sounds: a reference course with 49 sounds. */
export const ReferenceCourse: Story = {
  args: { view: ATLAS_COURSE_VIEW },
};

/** Right after enrolling from the page: every action reads Start course. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug]);
  },
};

/** On a phone: one column, with the enroll bar at the bottom. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};

/** Spanish copy; course content stays as the manifest declares it. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
