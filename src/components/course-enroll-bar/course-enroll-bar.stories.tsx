import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CourseEnrollBar } from "./course-enroll-bar";

const meta = {
  title: "Components/CourseEnrollBar",
  component: CourseEnrollBar,
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile2" } },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <div className="flex min-h-[60vh] flex-col justify-end px-4">
          <Story />
        </div>
      </NiceModal.Provider>
    ),
  ],
  args: { view: BASIC_COURSE_VIEW },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([]);
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CourseEnrollBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course on a phone: title, size and Enroll. Hidden from `lg` up. */
export const NotEnrolled: Story = {};

/** After enrolling: the action reads Start course. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug]);
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
