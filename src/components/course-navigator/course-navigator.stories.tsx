/**
 * Storybook stories for `<CourseNavigator />`.
 *
 * This story is the **first driving adapter** wired to the hexagonal domain
 * (see proposal.md, design.md). Storybook is treated as a real actor — it
 * reads the application in isolation from HTTP, the database, and the
 * browser. Wiring the in-memory adapters here proves the hexágono works
 * before the Next.js page wires it.
 */
import { InMemoryCourseRepository } from "@/adapters/persistence/in-memory/in-memory-course-repository/in-memory-course-repository";
import { InMemoryLessonRepository } from "@/adapters/persistence/in-memory/in-memory-lesson-repository/in-memory-lesson-repository";
import { InMemoryModuleRepository } from "@/adapters/persistence/in-memory/in-memory-module-repository/in-memory-module-repository";
import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseNavigator } from "./course-navigator";

/**
 * A course of three lessons in one module — the smallest shape that renders
 * both states this component has: a next lesson, and the end of the course.
 *
 * Written here rather than read from the content seed: the seed is generated
 * from a 15 GB content root a Storybook reviewer need not have, and its rows
 * change whenever content does. What these stories need is stable.
 */
const STORY_COURSE_ID = "11111111-1111-4111-8111-111111111111";
const STORY_MODULE_ID = "33333333-3333-4333-8333-333333333331";
const STORY_LESSON_IDS = [
  "22222222-2222-4222-8222-222222222220",
  "22222222-2222-4222-8222-222222222221",
  "22222222-2222-4222-8222-222222222222",
] as const;

const storyCourse = Course.parse({
  id: STORY_COURSE_ID,
  slug: "story-pronunciation",
  title: "Foundational Pronunciation",
  description: "Vowels, consonant clusters and word stress.",
  language: "en",
  lessonCount: STORY_LESSON_IDS.length,
  moduleCount: 1,
  sequence: 1,
});

const storyModules = [
  Module.parse({
    id: STORY_MODULE_ID,
    courseId: STORY_COURSE_ID,
    slug: "vowels-and-consonants",
    title: "Vowels and consonants",
    sequence: 1,
  }),
];

const storyLessons = ["Vowels: short vs. long", "Consonant clusters", "Word stress patterns"].map(
  (title, index) =>
    Lesson.parse({
      kind: "reading",
      id: STORY_LESSON_IDS[index],
      courseId: STORY_COURSE_ID,
      moduleId: STORY_MODULE_ID,
      sequence: index + 1,
      title,
      body: `Practice material for "${title}".`,
    }),
);

/**
 * Wiring is parameterized via decorators: every story builds its own
 * `findNextLesson` from in-memory adapters so each renders the right state
 * (next-lesson, course-completed, error) deterministically.
 */
function makeFindNextLessonFromSeed() {
  return makeFindNextLesson({
    courses: new InMemoryCourseRepository([storyCourse]),
    lessons: new InMemoryLessonRepository(storyLessons),
    modules: new InMemoryModuleRepository(storyModules),
  });
}

const meta = {
  title: "Components/CourseNavigator",
  component: CourseNavigator,
  parameters: {
    layout: "centered",
    locale: "en",
  },
} satisfies Meta<typeof CourseNavigator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Lesson 1 → recommends Lesson 2 ("Consonant clusters"). */
export const EnglishStart: Story = {
  parameters: { locale: "en" },
  args: {
    courseId: storyCourse.id as CourseId,
    currentLessonId: storyLessons[0]!.id as LessonId,
    findNextLesson: makeFindNextLessonFromSeed(),
  },
};

/** Lesson 3 (last) → renders "course completed" message. */
export const EnglishFinished: Story = {
  parameters: { locale: "en" },
  args: {
    courseId: storyCourse.id as CourseId,
    currentLessonId: storyLessons[2]!.id as LessonId,
    findNextLesson: makeFindNextLessonFromSeed(),
  },
};

/** Spanish locale: same flow with translated strings. */
export const SpanishStart: Story = {
  parameters: { locale: "es" },
  args: {
    courseId: storyCourse.id as CourseId,
    currentLessonId: storyLessons[0]!.id as LessonId,
    findNextLesson: makeFindNextLessonFromSeed(),
  },
};
