import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ATLAS_COURSE_VIEW, BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CourseEnrollCard } from "./course-enroll-card";

const meta = {
  title: "Components/CourseEnrollCard",
  component: CourseEnrollCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <div className="w-80">
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
} satisfies Meta<typeof CourseEnrollCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course before joining: about 5 weeks at 20 minutes a day. */
export const NotEnrolled: Story = {};

/** The same card once the learner has enrolled from the page. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug]);
  },
};

/** The Atlas of American Sounds: twelve lessons and twelve prizes. */
export const ReferenceCourse: Story = {
  args: { view: ATLAS_COURSE_VIEW },
};

/** Spanish copy, including the plural in the pace line. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
