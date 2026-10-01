import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  ADVANCED_COURSE_VIEW,
  BASIC_COURSE_VIEW,
} from "../../../../.storybook/fixtures/course-views";
import { EnrollmentWelcomeModal } from "./enrollment-welcome-modal";

/** The Advanced course with no artwork on any video. */
const ADVANCED_WITHOUT_POSTERS: CourseForView = {
  ...ADVANCED_COURSE_VIEW,
  moduleSummaries: ADVANCED_COURSE_VIEW.moduleSummaries.map((summary) => ({
    ...summary,
    lessons: summary.lessons.map((lesson) => ({ ...lesson, poster: undefined })),
  })),
};

/** The Advanced course before any video was published. */
const ADVANCED_WITHOUT_VIDEOS: CourseForView = {
  ...ADVANCED_COURSE_VIEW,
  moduleSummaries: ADVANCED_COURSE_VIEW.moduleSummaries.map((summary) => ({
    ...summary,
    lessonCount: 0,
    totalDurationSeconds: 0,
    lessons: [],
  })),
};

/** A trigger standing in for the course page's Enroll action. */
function EnrollTrigger({ view }: { view: CourseForView }) {
  return (
    <button
      type="button"
      onClick={() => void NiceModal.show(EnrollmentWelcomeModal, { view })}
      className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground"
    >
      Enroll in {view.course.title}
    </button>
  );
}

const meta = {
  title: "Components/EnrollmentWelcomeModal",
  component: EnrollTrigger,
  args: { view: ADVANCED_COURSE_VIEW },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <Story />
      </NiceModal.Provider>
    ),
  ],
  beforeEach: ({ args }) => {
    resetLearnerStore();
    givenLearner.enrolledCourses([args.view.course.slug]);
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof EnrollTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Just enrolled in the Advanced course: its first video's poster, and Start course. */
export const Welcome: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(await within(document.body).findByRole("dialog")).toBeInTheDocument();
  },
};

/** Another course: the Basic Course's first video. */
export const BasicCourse: Story = {
  args: { view: BASIC_COURSE_VIEW },
  play: Welcome.play,
};

/** The starting video has no artwork, so the dialog opens on the mark. */
export const WithoutPoster: Story = {
  args: { view: ADVANCED_WITHOUT_POSTERS },
  play: Welcome.play,
};

/** A course with no videos yet: nothing to start, only Keep exploring. */
export const WithoutVideos: Story = {
  args: { view: ADVANCED_WITHOUT_VIDEOS },
  play: Welcome.play,
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  play: Welcome.play,
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  play: Welcome.play,
};
