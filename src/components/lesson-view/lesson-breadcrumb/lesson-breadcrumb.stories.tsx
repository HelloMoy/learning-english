import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import { LessonBreadcrumb } from "./lesson-breadcrumb";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

void useTranslations;

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());

const meta = {
  title: "LessonView/LessonBreadcrumb",
  component: LessonBreadcrumb,
} satisfies Meta<typeof LessonBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    course: Course.parse({
      id: courseId,
      slug: "english-a1-pronunciation",
      title: "Basic — Foundational Pronunciation",
      description: "Pronunciation fundamentals",
      language: "en",
      lessonCount: 3,
      moduleCount: 2,
    }),
    module: Module.parse({
      id: moduleId,
      courseId,
      slug: "vowels",
      title: "Vowels",
      sequence: 1,
    }),
    lesson: Lesson.parse({
      kind: "video",
      id: LessonId.parse(faker.string.uuid()),
      courseId,
      moduleId,
      sequence: 1,
      title: "Vowels: short vs. long",
      description: "desc",
      source: faker.internet.url(),
      durationSeconds: 600,
    }),
  },
};
