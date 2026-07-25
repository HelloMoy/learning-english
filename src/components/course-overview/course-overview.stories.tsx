import { Course } from "@/domain/entities/course/course";
import { CourseId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseOverview } from "./course-overview";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "107 lessons across 10 modules covering American English pronunciation.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
});
const modules = Array.from({ length: 10 }, (_, index) =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: `${index + 1}-module`,
    title: `Module ${index + 1}`,
    sequence: index + 1,
  }),
);
const firstLesson = Lesson.parse({
  kind: "video",
  id: "9e9d39a2-d2bb-57bb-9a5e-37de8c3e2a1c",
  courseId: course.id,
  moduleId: modules[0]!.id,
  sequence: 1,
  title: "Welcome",
  description: "Welcome to the course.",
  source: "/local-filesystem-lesson/advanced-intermediate-course/1-module/welcome.mp4",
  durationSeconds: 195,
});

const meta: Meta<typeof CourseOverview> = {
  title: "Components/CourseOverview",
  component: CourseOverview,
  args: {
    course,
    modules,
    firstLesson,
  },
};

export default meta;

type Story = StoryObj<typeof CourseOverview>;

export const Default: Story = {};

export const NoFirstLesson: Story = {
  args: {
    modules: modules.slice(0, 3),
    firstLesson: null,
  },
};
