import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
  videoOf,
} from "../../../.storybook/fixtures/course-views";
import { EnrolledCourseCard } from "./enrolled-course-card";

const everyVideo = (view: CourseForView) =>
  view.moduleSummaries.flatMap(({ lessons }) => lessons.map(({ id }) => id));

const TH_VOICELESS = videoOf(BASIC_COURSE_VIEW, 2, 11);

/** Basic Course: the vowels and the first eleven consonants watched, /θ/ next and started. */
const inProgress = (() => {
  const done = [
    ...BASIC_COURSE_VIEW.moduleSummaries[0]!.lessons,
    ...BASIC_COURSE_VIEW.moduleSummaries[1]!.lessons,
    ...BASIC_COURSE_VIEW.moduleSummaries[2]!.lessons.slice(0, 11),
  ].map(({ id }) => id);
  const positions = new Map([[TH_VOICELESS.id, 120]]);
  const shelf = courseShelf({
    courses: [BASIC_COURSE_VIEW],
    enrolledSlugs: new Set([BASIC_COURSE_VIEW.course.slug]),
    records: [
      ContinueWatchingRecord.parse({
        location: {
          courseSlug: BASIC_COURSE_VIEW.course.slug,
          moduleSlug: BASIC_COURSE_VIEW.modules[2]!.slug,
          lessonId: TH_VOICELESS.id,
        },
        watchedAt: 0,
      }),
    ],
    completedIds: new Set(done),
    positions,
  });
  return courseCardModel(shelf.featured!, { positions, claimedPrizes: new Set() });
})();

/** Every Basic video watched and every prize claimed. */
const completed = (() => {
  const shelf = courseShelf({
    courses: [BASIC_COURSE_VIEW],
    enrolledSlugs: new Set([BASIC_COURSE_VIEW.course.slug]),
    records: [],
    completedIds: new Set(everyVideo(BASIC_COURSE_VIEW)),
    positions: new Map(),
  });
  return courseCardModel(shelf.featured!, {
    positions: new Map(),
    claimedPrizes: new Set(BASIC_COURSE_VIEW.modules.map(({ slug }) => slug)),
  });
})();

/** Enrolled in the Atlas of American Sounds, not started. */
const referenceCourse = (() => {
  const shelf = courseShelf({
    courses: [ATLAS_COURSE_VIEW],
    enrolledSlugs: new Set([ATLAS_COURSE_VIEW.course.slug]),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
  });
  return courseCardModel(shelf.featured!, { positions: new Map(), claimedPrizes: new Set() });
})();

const meta = {
  title: "Components/EnrolledCourseCard",
  component: EnrolledCourseCard,
  parameters: { layout: "padded" },
  args: { model: inProgress },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EnrolledCourseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Part-way through, with the next video named and started. */
export const InProgress: Story = {};

/** Every video watched: Completed, prizes, Watch again. */
export const Completed: Story = {
  args: { model: completed },
};

/** A reference course: it reads Reference where a level reads Level N. */
export const ReferenceCourse: Story = {
  args: { model: referenceCourse },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
