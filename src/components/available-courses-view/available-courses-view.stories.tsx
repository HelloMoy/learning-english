import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
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
import { AvailableCoursesView } from "./available-courses-view";

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

const meta = {
  title: "Components/AvailableCoursesView",
  component: AvailableCoursesView,
  parameters: { layout: "padded" },
  args: { courses: CATALOG_VIEWS },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([BASIC_COURSE_VIEW.course.slug]);
    givenLearner.completed(basicWatched);
    givenLearner.continueWatchingByCourse([placeIn(BASIC_COURSE_VIEW, 2, 11, Date.now())]);
  },
} satisfies Meta<typeof AvailableCoursesView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enrolled in the Basic Course: its poster leads, the Advanced course and the Atlas wait to be joined. */
export const EnrolledInBasic: Story = {};

/** Enrolled in both levels, the Advanced course watched last: its poster leads and Basic follows. */
export const EnrolledInBoth: Story = {
  beforeEach: () => {
    givenLearner.enrolledCourses([ADVANCED_COURSE_VIEW.course.slug]);
    givenLearner.positions({ [videoOf(ADVANCED_COURSE_VIEW, 5, 2).id]: 365 });
    givenLearner.continueWatchingByCourse([
      placeIn(ADVANCED_COURSE_VIEW, 5, 2, Date.now()),
      placeIn(BASIC_COURSE_VIEW, 2, 11, Date.now() - 86_400_000),
    ]);
  },
};

/** Enrolled in nothing: the next-up bar offers the Basic Course's first video above the heading. */
export const EnrolledInNothing: Story = {
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.enrolledCourses([]);
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** A new learner in Spanish: the bar reads "Lo que sigue · Basic Course". */
export const EnrolledInNothingInSpanish: Story = {
  ...EnrolledInNothing,
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
