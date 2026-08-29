import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

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
