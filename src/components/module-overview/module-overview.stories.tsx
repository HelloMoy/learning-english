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
  sequence: 1,
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

/**
 * Real seed paths, so the artwork actually resolves in the Storybook
 * preview instead of rendering four broken boxes.
 */
const SEED_POSTERS = [
  "/local-filesystem-lesson/advanced-intermediate-course/8-everyday-english-phrases-part-2-master-them/1-common-english-expressions-32/d4f813e-37a2-7017-d07-15b4830b8b3-snapshot-2104770.jpeg",
  "/local-filesystem-lesson/advanced-intermediate-course/8-everyday-english-phrases-part-2-master-them/2-common-english-expressions-33/acc2f4e-111e-65f-7113-8336a34c210-snapshot-2104771.jpeg",
  "/local-filesystem-lesson/advanced-intermediate-course/8-everyday-english-phrases-part-2-master-them/3-common-english-expressions-34/57830-c24e-baeb-46bc-e773e6a24b7-snapshot-2104772.jpeg",
];

/**
 * Three lessons with artwork and one deliberately without, so the poster
 * rows and the gradient fallback can be compared side by side. The real
 * course never produces the fallback — all 107 lessons have a poster — so
 * this story is the only place it is reviewable.
 */
const mixedLessons = lessons.map((lesson, index) =>
  Lesson.parse(
    index < SEED_POSTERS.length ? { ...lesson, poster: SEED_POSTERS[index] } : { ...lesson },
  ),
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

/**
 * Video rows showing their own artwork. The fourth lesson has no poster
 * and keeps the gradient tile with its play circle.
 *
 * The thumbnails are clickable and lead to the same lesson as "Open", but
 * only for pointer users — they are `aria-hidden` and out of the tab order,
 * so tabbing through this story should stop once per row, not twice.
 */
export const WithPosters: Story = {
  args: { lessons: mixedLessons },
};

/**
 * The failure the `sm:truncate` breakpoint exists to prevent. The real
 * course's largest module is 16 rows whose titles all begin
 * "Exercise N Pronunciation Step By Step Lesson"; cut to one line on a phone
 * every row reads "Exercise 1 Pronunciati…" and the list stops being a way to
 * choose a lesson. At this width the titles must wrap.
 */
export const SharedPrefixTitlesOnPhone: Story = {
  args: {
    lessons: lessons.map((lesson, index) =>
      Lesson.parse({
        ...lesson,
        title: `Exercise ${index + 1} Pronunciation Step By Step Lesson`,
      }),
    ),
  },
  parameters: {
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};
