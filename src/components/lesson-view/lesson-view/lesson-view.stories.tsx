import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import { LessonView } from "./lesson-view";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

void useTranslations;

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "basic-pronunciation",
  title: "Basic — Foundational Pronunciation",
  description: "Pronunciation fundamentals for English A1 learners.",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
});
const mod = Module.parse({
  id: moduleId,
  courseId,
  slug: "vowels-and-video-intro",
  title: "Vowels and video intro",
  sequence: 1,
});
const videoLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId,
  sequence: 1,
  title: "Vowels: short vs. long",
  description: "A 10-minute walkthrough of the five short/long vowel pairs.",
  source: "/videos/vowels.mp4",
  durationSeconds: 600,
  poster: "/thumbnails/vowels.jpg",
});
const readingLesson = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId,
  sequence: 2,
  title: "Drills: minimal pairs",
  body: "Practice distinguishing short and long vowels.",
});
const resource = Resource.parse({
  id: faker.string.uuid(),
  lessonId: videoLesson.id,
  title: "Vowel chart (PDF)",
  url: faker.internet.url(),
  kind: "pdf",
});

const happyPathView: LessonViewData = {
  course,
  module: mod,
  lesson: videoLesson,
  resources: [resource],
  nextLesson: readingLesson,
  modules: [mod],
  lessons: [videoLesson, readingLesson],
};

const meta = {
  title: "LessonView/LessonView",
  component: LessonView,
} satisfies Meta<typeof LessonView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HappyPath: Story = {
  args: {
    view: happyPathView,
    markComplete: () => Promise.resolve({ completed: true }),
  },
};

export const NoResources: Story = {
  args: {
    view: { ...happyPathView, resources: [] },
    markComplete: () => Promise.resolve({ completed: true }),
  },
};

export const CourseCompleted: Story = {
  args: {
    view: { ...happyPathView, nextLesson: null },
    markComplete: () => Promise.resolve({ completed: true }),
  },
};

export const ReadingLesson: Story = {
  args: {
    view: { ...happyPathView, lesson: readingLesson, nextLesson: null },
    markComplete: () => Promise.resolve({ completed: true }),
  },
};
