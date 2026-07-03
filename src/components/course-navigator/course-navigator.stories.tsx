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
import { seedCourse, seedLessons } from "@/adapters/persistence/in-memory/seed/seed";
import { CourseId, LessonId } from "@/domain/entities/ids/ids";
import { makeFindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseNavigator } from "./course-navigator";

/**
 * Wiring is parameterized via decorators: every story builds its own
 * `findNextLesson` from in-memory adapters so each renders the right state
 * (next-lesson, course-completed, error) deterministically.
 */
function makeFindNextLessonFromSeed() {
  return makeFindNextLesson({
    courses: new InMemoryCourseRepository([seedCourse]),
    lessons: new InMemoryLessonRepository(seedLessons),
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

/** Lesson 1 → recommends Lesson 2 ("Consonant clusters in English"). */
export const EnglishStart: Story = {
  parameters: { locale: "en" },
  args: {
    courseId: seedCourse.id as CourseId,
    currentLessonId: seedLessons[0]!.id as LessonId,
    findNextLesson: makeFindNextLessonFromSeed(),
  },
};

/** Lesson 3 (last) → renders "course completed" message. */
export const EnglishFinished: Story = {
  parameters: { locale: "en" },
  args: {
    courseId: seedCourse.id as CourseId,
    currentLessonId: seedLessons[2]!.id as LessonId,
    findNextLesson: makeFindNextLessonFromSeed(),
  },
};

/** Spanish locale: same flow with translated strings. */
export const SpanishStart: Story = {
  parameters: { locale: "es" },
  args: {
    courseId: seedCourse.id as CourseId,
    currentLessonId: seedLessons[0]!.id as LessonId,
    findNextLesson: makeFindNextLessonFromSeed(),
  },
};
