import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonCompletionToggle } from "../lesson-completion-toggle/lesson-completion-toggle";
import { LessonCloseCard } from "./lesson-close-card";

const courseId = CourseId.parse(faker.string.uuid());
const nextModuleId = ModuleId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 2,
  moduleCount: 2,
  sequence: 1,
});
const nextModule = Module.parse({
  id: nextModuleId,
  courseId,
  slug: "consonants-and-stress",
  title: "Module 2",
  sequence: 2,
});
const nextLesson = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: nextModuleId,
  sequence: 1,
  title: "The Vowel Sound: /ə/ (the most important one)",
  body: "body",
});

/**
 * The closing block of the Lesson Page. Its chrome is phone-only, so review it
 * at `mobile1`: from `lg` up the card collapses to the bare "Mark as complete"
 * button and the rail's `UpNextCard` takes the next lesson back.
 */
const meta = {
  title: "LessonView/LessonCloseCard",
  component: LessonCloseCard,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <Story />
      </NiceModal.Provider>
    ),
  ],
  args: {
    course,
    children: (
      <LessonCompletionToggle
        lessonId={LessonId.parse(faker.string.uuid())}
        markComplete={async () => ({ data: { completed: true } })}
        unmarkComplete={async () => ({ data: { unmarked: true } })}
      />
    ),
  },
} satisfies Meta<typeof LessonCloseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual case: mark the lesson, then continue into the next one. */
export const Default: Story = {
  args: { nextLesson, nextLessonModule: nextModule },
};

/** The next lesson opens the following module — the row links there, not here. */
export const CrossModuleNext: Story = {
  args: {
    nextLesson: Lesson.parse({
      kind: "reading",
      id: LessonId.parse(faker.string.uuid()),
      courseId,
      moduleId: nextModuleId,
      sequence: 1,
      title: "Word stress patterns (next module)",
      body: "body",
    }),
    nextLessonModule: nextModule,
  },
};

/** The last lesson of the course: the row gives way to the terminal message. */
export const CourseCompleted: Story = {
  args: { nextLesson: null, nextLessonModule: null },
};

/** From `lg` up the chrome is gone and only the action remains. */
export const OnDesktop: Story = {
  args: { nextLesson, nextLessonModule: nextModule },
  parameters: { viewport: { defaultViewport: "desktop" } },
};
