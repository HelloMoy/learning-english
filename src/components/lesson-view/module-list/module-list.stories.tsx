import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import { ModuleList } from "./module-list";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

void useTranslations;

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
});
const modA = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "vowels-and-video-intro",
  title: "Vowels",
  sequence: 1,
});
const modB = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "consonants-and-stress",
  title: "Consonants",
  sequence: 2,
});
const lessonA1 = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: modA.id,
  sequence: 1,
  title: "Vowels video",
  description: "d",
  source: faker.internet.url(),
  durationSeconds: 600,
});
const lessonB1 = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: modB.id,
  sequence: 1,
  title: "Consonant reading",
  body: "body",
});

const map = new Map<string, Lesson[]>([
  [modA.id, [lessonA1]],
  [modB.id, [lessonB1]],
]);

const meta = {
  title: "LessonView/ModuleList",
  component: ModuleList,
} satisfies Meta<typeof ModuleList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoModules: Story = {
  args: {
    course,
    modules: [modA, modB],
    lessonsByModuleId: map,
    currentLessonId: lessonA1.id,
  },
};

export const OneModule: Story = {
  args: {
    course,
    modules: [modA],
    lessonsByModuleId: new Map([[modA.id, [lessonA1]]]),
    currentLessonId: lessonA1.id,
  },
};
