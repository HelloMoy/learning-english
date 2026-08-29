import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OutlineDrawer } from "./outline-drawer";

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
});
const mod = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "vowels-and-video-intro",
  title: "Module",
  sequence: 1,
});
const lessonA = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: mod.id,
  sequence: 1,
  title: "Lesson A",
  description: "d",
  source: faker.internet.url(),
  durationSeconds: 600,
});
const lessonB = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: mod.id,
  sequence: 2,
  title: "Lesson B",
  body: "b",
});

const meta = {
  title: "LessonView/OutlineDrawer",
  component: OutlineDrawer,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
} satisfies Meta<typeof OutlineDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  args: {
    course,
    modules: [mod],
    lessonsByModuleId: new Map([[mod.id, [lessonA, lessonB]]]),
    currentLessonId: lessonA.id,
  },
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Mobile: Story = {
  args: {
    course,
    modules: [mod],
    lessonsByModuleId: new Map([[mod.id, [lessonA, lessonB]]]),
    currentLessonId: lessonA.id,
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
