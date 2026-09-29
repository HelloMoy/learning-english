import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  BASIC_COURSE_VIEW,
  CATALOG_VIEWS,
  videoOf,
} from "../../../.storybook/fixtures/course-views";
import { MyLearningView } from "./my-learning-view";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Every fake is built once at module scope, so re-renders share one store. */
const learner: LearnerProfileRepository = {
  get: async () =>
    LearnerProfile.parse({ name: "Ana García", avatar: { kind: "illustration", id: "wave" } }),
  set: async () => {},
};

const placeIn = (
  view: CourseForView,
  moduleIndex: number,
  lessonIndex: number,
  watchedAt: number,
) => ({
  location: ContinueWatchingLocation.parse({
    courseSlug: view.course.slug,
    moduleSlug: view.modules[moduleIndex]!.slug,
    lessonId: videoOf(view, moduleIndex, lessonIndex).id,
  }),
  watchedAt,
});

/** The vowels and the first eleven consonants of the Basic Course. */
const basicWatched = [
  ...BASIC_COURSE_VIEW.moduleSummaries[0]!.lessons,
  ...BASIC_COURSE_VIEW.moduleSummaries[1]!.lessons,
  ...BASIC_COURSE_VIEW.moduleSummaries[2]!.lessons.slice(0, 11),
].map(({ id }) => id);

const RULE_3 = videoOf(ADVANCED_COURSE_VIEW, 5, 2);

const meta = {
  title: "Components/MyLearningView",
  component: MyLearningView,
  parameters: { layout: "padded" },
  args: { courses: CATALOG_VIEWS, profiles: learner },
  decorators: [
    (Story) => (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-12 sm:px-11">
        <Story />
      </main>
    ),
  ],
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug, ADVANCED_COURSE_VIEW.course.slug]);
    givenLearner.completed(basicWatched);
    givenLearner.positions({ [RULE_3.id]: 365 });
    givenLearner.continueWatchingByCourse([
      placeIn(ADVANCED_COURSE_VIEW, 5, 2, Date.now() - DAY_MS),
      placeIn(BASIC_COURSE_VIEW, 2, 11, Date.now() - 3 * DAY_MS),
    ]);
  },
} satisfies Meta<typeof MyLearningView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enrolled in both, the Advanced course watched last: it leads, and both courses are listed. */
export const EnrolledInBoth: Story = {};

/** Enrolled in the Basic Course and never started: Start here. */
export const JustEnrolled: Story = {
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug]);
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
