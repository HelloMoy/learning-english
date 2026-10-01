import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
  videoOf,
} from "../../../.storybook/fixtures/course-views";
import { CoursePoster } from "./course-poster";

/** An enrolled course read through the real shelf, optionally left part-way into a video. */
function enrolledModel(
  view: CourseForView,
  place?: { moduleIndex: number; lessonIndex: number; positionSeconds: number },
  completedIds: ReadonlyArray<string> = [],
) {
  const video = place ? videoOf(view, place.moduleIndex, place.lessonIndex) : undefined;
  const positions = new Map(video && place ? [[video.id, place.positionSeconds]] : []);
  const records =
    video && place
      ? [
          ContinueWatchingRecord.parse({
            location: {
              courseSlug: view.course.slug,
              moduleSlug: view.modules[place.moduleIndex]!.slug,
              lessonId: video.id,
            },
            watchedAt: 0,
          }),
        ]
      : [];
  const shelf = courseShelf({
    courses: [view],
    enrolledSlugs: new Set([view.course.slug]),
    records,
    completedIds: new Set(completedIds),
    positions,
  });
  return courseCardModel(shelf.featured!, { positions, claimedPrizes: new Set() });
}

const everyVideoOf = (view: CourseForView) =>
  view.moduleSummaries.flatMap(({ lessons }) => lessons.map(({ id }) => id));

const meta = {
  title: "Components/CoursePoster",
  component: CoursePoster,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    entry: {
      kind: "enrolled",
      model: enrolledModel(BASIC_COURSE_VIEW, {
        moduleIndex: 1,
        lessonIndex: 3,
        positionSeconds: 252,
      }),
    },
  },
} satisfies Meta<typeof CoursePoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enrolled in the Basic Course, four minutes into a vowel video: the chip says where to resume. */
export const EnrolledResuming: Story = {};

/** Enrolled in the Basic Course, never opened: Next up and Start course. */
export const EnrolledNotStarted: Story = {
  args: { entry: { kind: "enrolled", model: enrolledModel(BASIC_COURSE_VIEW) } },
};

/** Every video of the Basic Course watched: Completed and Watch again. */
export const Completed: Story = {
  args: {
    entry: {
      kind: "enrolled",
      model: enrolledModel(BASIC_COURSE_VIEW, undefined, everyVideoOf(BASIC_COURSE_VIEW)),
    },
  },
};

/** The Advanced course, not joined: its size, prizes to win, and Enroll and View details, which both open its course page. */
export const Joinable: Story = {
  args: { entry: { kind: "joinable", view: ADVANCED_COURSE_VIEW } },
};

/** The Atlas of American Sounds, not joined: reference material, never a level. */
export const JoinableReference: Story = {
  args: { entry: { kind: "joinable", view: ATLAS_COURSE_VIEW } },
};

/** The joinable Advanced poster in Spanish, with its Spanish brief. */
export const InSpanish: Story = {
  args: { entry: { kind: "joinable", view: ADVANCED_COURSE_VIEW } },
  parameters: { locale: "es" },
};
