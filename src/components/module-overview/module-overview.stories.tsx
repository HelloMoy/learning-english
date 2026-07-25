import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleOverview } from "./module-overview";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "107 lessons across 10 modules.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
});
const mod = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "1-advanced-pronunciation-course",
  title: "Advanced Pronunciation Course",
  sequence: 1,
});
const lessons = Array.from({ length: 4 }, (_, index) =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId: course.id,
    moduleId: mod.id,
    sequence: index + 1,
    title: `Lesson ${index + 1}`,
    description: "Lesson description",
    source: "/local-filesystem-lesson/lesson.mp4",
    durationSeconds: 180 + index * 30,
  }),
);

const meta: Meta<typeof ModuleOverview> = {
  title: "Components/ModuleOverview",
  component: ModuleOverview,
  args: {
    course,
    module: mod,
    lessons,
  },
};

export default meta;

type Story = StoryObj<typeof ModuleOverview>;

export const Default: Story = {};
