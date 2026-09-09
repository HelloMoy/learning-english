import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonList } from "./lesson-list";

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
  sequence: 1,
});
const courseModule = Module.parse({
  id: moduleId,
  courseId,
  slug: "vowels-and-video-intro",
  title: "Module",
  sequence: 1,
});
const lessons = [
  Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence: 1,
    title: "First lesson",
    body: "body",
  }),
  Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence: 2,
    title: "Second lesson",
    body: "body",
  }),
];

const VIDEO_DURATION_SECONDS = 600;

const videoLessons = [1, 2, 3].map((sequence) =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title: `Video lesson ${sequence}`,
    description: `Video lesson ${sequence}`,
    source: "/local-filesystem-lesson/lesson.mp4",
    durationSeconds: VIDEO_DURATION_SECONDS,
  }),
);

/**
 * Seeds browser storage so the progress stories have something to read: one
 * lesson finished, one partway, one never opened. The bar's whole input is
 * `localStorage`, so a story cannot show it without writing there first.
 */
function seedWatchProgress() {
  const [finished, partly, untouched] = videoLessons;
  window.localStorage.setItem(
    `learning-english:playback:${finished!.id}`,
    String(finishThresholdSeconds(VIDEO_DURATION_SECONDS)),
  );
  window.localStorage.setItem(
    `learning-english:playback:${partly!.id}`,
    String(VIDEO_DURATION_SECONDS * 0.4),
  );
  window.localStorage.removeItem(`learning-english:playback:${untouched!.id}`);
  refreshSavedPlaybackPositions();
}

const meta = {
  title: "LessonView/LessonList",
  component: LessonList,
} satisfies Meta<typeof LessonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { course, module: courseModule, lessons, currentLessonId: lessons[0]!.id },
};

export const FirstIsCurrent: Story = {
  args: { course, module: courseModule, lessons, currentLessonId: lessons[0]!.id },
};

export const LastIsCurrent: Story = {
  args: { course, module: courseModule, lessons, currentLessonId: lessons[1]!.id },
};

/**
 * The three states side by side: finished, partway, and never opened. The
 * last renders no bar at all — progress lives in `localStorage`, which the
 * server cannot read, so a bar drawn at zero would assert in the first frame
 * that the learner has watched nothing.
 *
 * The bar is a sibling of each row's link, not a child, so the link's
 * accessible name stays the lesson title and the row keeps one tab stop.
 */
export const WithWatchProgress: Story = {
  args: {
    course,
    module: courseModule,
    lessons: videoLessons,
    currentLessonId: videoLessons[1]!.id,
  },
  decorators: [
    (Story) => {
      seedWatchProgress();
      return <Story />;
    },
  ],
};
