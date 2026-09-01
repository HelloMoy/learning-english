import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UpNextCard } from "./up-next-card";

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());
const nextModuleId = ModuleId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 1,
  moduleCount: 2,
  sequence: 1,
});
const courseModule = Module.parse({
  id: moduleId,
  courseId,
  slug: "vowels-and-video-intro",
  title: "Module",
  sequence: 1,
});
const otherModule = Module.parse({
  id: nextModuleId,
  courseId,
  slug: "consonants-and-stress",
  title: "Module 2",
  sequence: 2,
});

const meta = {
  title: "LessonView/UpNextCard",
  component: UpNextCard,
} satisfies Meta<typeof UpNextCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithNextLesson: Story = {
  args: {
    course,
    nextLesson: Lesson.parse({
      kind: "reading",
      id: LessonId.parse(faker.string.uuid()),
      courseId,
      moduleId,
      sequence: 2,
      title: "Drills: minimal pairs",
      body: "body",
    }),
    nextLessonModule: courseModule,
  },
};

export const CrossModuleNext: Story = {
  args: {
    course,
    nextLesson: Lesson.parse({
      kind: "reading",
      id: LessonId.parse(faker.string.uuid()),
      courseId,
      moduleId: nextModuleId,
      sequence: 1,
      title: "Word stress patterns (next module)",
      body: "body",
    }),
    nextLessonModule: otherModule,
  },
};

export const CourseCompleted: Story = {
  args: { course, nextLesson: null, nextLessonModule: null },
};
