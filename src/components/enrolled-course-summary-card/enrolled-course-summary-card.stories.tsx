import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW, videoOf } from "../../../.storybook/fixtures/course-views";
import { EnrolledCourseSummaryCard } from "./enrolled-course-summary-card";

const TH_VOICELESS = videoOf(BASIC_COURSE_VIEW, 2, 11);

/** Basic Course: the vowels and the first eleven consonants watched, /θ/ next. */
const basicInProgress = (() => {
  const done = [
    ...BASIC_COURSE_VIEW.moduleSummaries[0]!.lessons,
    ...BASIC_COURSE_VIEW.moduleSummaries[1]!.lessons,
    ...BASIC_COURSE_VIEW.moduleSummaries[2]!.lessons.slice(0, 11),
  ].map(({ id }) => id);
  const positions = new Map([[TH_VOICELESS.id, 90]]);
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

const meta = {
  title: "Components/EnrolledCourseSummaryCard",
  component: EnrolledCourseSummaryCard,
  parameters: { layout: "padded" },
  args: { model: basicInProgress, isCurrent: false },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EnrolledCourseSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A course part-way through, with its own next video. */
export const InProgress: Story = {};

/** The course My learning leads with: the gold border. */
export const Current: Story = {
  args: { isCurrent: true },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
