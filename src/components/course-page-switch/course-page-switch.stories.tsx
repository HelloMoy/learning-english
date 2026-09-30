import { CourseDetailView } from "@/components/course-detail-view/course-detail-view";
import { CourseOverview } from "@/components/course-overview/course-overview";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CoursePageSwitch } from "./course-page-switch";

const { course, modules, moduleSummaries } = BASIC_COURSE_VIEW;

const meta = {
  title: "Components/CoursePageSwitch",
  component: CoursePageSwitch,
  parameters: { layout: "fullscreen" },
  args: {
    courseSlug: course.slug,
    title: course.title,
    detail: <CourseDetailView view={BASIC_COURSE_VIEW} />,
    board: (
      <CourseOverview
        course={course}
        modules={modules}
        moduleSummaries={moduleSummaries}
      />
    ),
  },
  beforeEach: () => {
    resetLearnerStore();
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CoursePageSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before the learner's enrollments are known: only the title, over placeholders. */
export const Pending: Story = {};

/** A learner who has not joined the Basic Course: the course page. */
export const NotEnrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([]);
  },
};

/** A learner enrolled in the Basic Course: the progress board, as before. */
export const Enrolled: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([course.slug]);
  },
};
