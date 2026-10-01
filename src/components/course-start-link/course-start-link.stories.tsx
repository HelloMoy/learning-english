import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ADVANCED_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CourseStartLink } from "./course-start-link";

const meta = {
  title: "Components/CourseStartLink",
  component: CourseStartLink,
  parameters: { layout: "centered" },
  args: { view: ADVANCED_COURSE_VIEW },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([ADVANCED_COURSE_VIEW.course.slug]);
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CourseStartLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing watched: Start course opens the first video. */
export const StartCourse: Story = {};

/** The first video finished: Continue where you left off opens the next one. */
export const WithProgress: Story = {
  beforeEach: () => {
    const [firstLesson] = ADVANCED_COURSE_VIEW.moduleSummaries[0]!.lessons;
    givenLearner.completed([firstLesson!.id]);
  },
};

/** Every video finished: Watch again opens the first video. */
export const Finished: Story = {
  beforeEach: () => {
    givenLearner.completed(
      ADVANCED_COURSE_VIEW.moduleSummaries.flatMap((summary) =>
        summary.lessons.map((lesson) => lesson.id),
      ),
    );
  },
};

/** Stretched to fill a card, a bar or a dialog. */
export const FullWidth: Story = {
  args: { className: "w-80" },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
