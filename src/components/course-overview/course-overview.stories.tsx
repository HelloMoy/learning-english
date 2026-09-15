import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
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
 * story built on ten identical modules would hide every layout case that
 * actually matters.
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

/** A real seed poster, so every tile shows artwork instead of an empty band. */
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
    lessons: Array.from({ length: lessonCount }, (_, lessonIndex) => ({
      id: LessonId.parse(faker.string.uuid()),
      sequence: lessonIndex + 1,
      title: `Lesson ${lessonIndex + 1}`,
      durationSeconds: Math.round((minutes * 60) / lessonCount),
      poster: POSTER,
    })),
  };
});

const meta: Meta<typeof CourseOverview> = {
  title: "Components/CourseOverview",
  component: CourseOverview,
  parameters: { layout: "fullscreen" },
  args: {
    course,
    modules,
    moduleSummaries,
  },
};

export default meta;

type Story = StoryObj<typeof CourseOverview>;

/**
 * All ten modules at their real sizes: the continue tile and the course's
 * progress, then ten lesson ring tiles in two rows of five. Narrow the viewport
 * to see each lesson become a row led by its ring.
 */
export const Default: Story = {};

/** A course whose modules hold no videos yet: no continue tile, empty rings. */
export const NoVideos: Story = {
  args: {
    modules: modules.slice(0, 3),
    moduleSummaries: moduleSummaries
      .slice(0, 3)
      .map((summary) => ({ ...summary, lessonCount: 0, totalDurationSeconds: 0, lessons: [] })),
  },
};
