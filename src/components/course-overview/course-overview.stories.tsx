import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

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
  sequence: 1,
});

/**
 * The real course's shape, module by module: title, lesson count and total
 * duration in minutes. The distribution is deliberately uneven — 1 lesson in
 * module 4, 31 in module 7, ten and a half hours in module 10 — because a
 * story built on ten identical six-lesson modules would hide every layout
 * case that actually matters.
 */
const REAL_MODULES: ReadonlyArray<[string, number, number]> = [
  ["Advanced Pronunciation Course", 4, 28],
  ["Advanced Vowel Pronunciation In American English", 13, 28],
  ["Contractions Reductions", 6, 60],
  ["Key Sound Patterns And Features", 1, 36],
  ["Sound Natural American Intonation Essentials", 6, 66],
  ["Rules For Speaking Fast Natural In English", 10, 150],
  ["Everyday English Phrases Part 1 Master Them", 31, 161],
  ["Everyday English Phrases Part 2 Master Them", 7, 40],
  ["Speak With Confidence In 30 Days", 13, 169],
  ["The Practice Zone Sharpen Your Skills", 16, 635],
];

/** A real seed poster, so the mosaic resolves instead of showing empty tiles. */
const POSTER =
  "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/1-intro/04ecdb-ec4d-8fea-d3f-dc020da6ec80-snapshot-554507553.jpeg";

const modules = REAL_MODULES.map(([title], index) =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: `${index + 1}-module`,
    title,
    sequence: index + 1,
  }),
);

const moduleSummaries: ModuleSummary[] = modules.map((module, index) => {
  const [, lessonCount, minutes] = REAL_MODULES[index]!;
  return {
    moduleId: module.id,
    lessonCount,
    totalDurationSeconds: minutes * 60,
    leadingLessons: Array.from({ length: Math.min(lessonCount, 6) }, (_, tile) => ({
      id: LessonId.parse(faker.string.uuid()),
      sequence: tile + 1,
      title: `Lesson ${tile + 1}`,
      poster: POSTER,
    })),
  };
});

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
    moduleSummaries,
    firstLesson,
  },
};

export default meta;

type Story = StoryObj<typeof CourseOverview>;

/**
 * All ten modules at their real sizes. Scan the ordinals down the left edge:
 * the page should read as a numbered index, and no card should read as a
 * single video.
 */
export const Default: Story = {};

export const NoFirstLesson: Story = {
  args: {
    modules: modules.slice(0, 3),
    moduleSummaries: moduleSummaries.slice(0, 3),
    firstLesson: null,
  },
};
