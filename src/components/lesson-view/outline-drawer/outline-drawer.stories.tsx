import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OutlineDrawer } from "./outline-drawer";

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
  sequence: 1,
});
const mod = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "vowels-and-video-intro",
  title: "Module",
  sequence: 1,
});
const lessonA = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: mod.id,
  sequence: 1,
  title: "Lesson A",
  description: "d",
  source: faker.internet.url(),
  durationSeconds: 600,
});
const lessonB = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: mod.id,
  sequence: 2,
  title: "Lesson B",
  body: "b",
});

const meta = {
  title: "LessonView/OutlineDrawer",
  component: OutlineDrawer,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
} satisfies Meta<typeof OutlineDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  args: {
    course,
    modules: [mod],
    lessonsByModuleId: new Map([[mod.id, [lessonA, lessonB]]]),
    currentLessonId: lessonA.id,
  },
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Mobile: Story = {
  args: {
    course,
    modules: [mod],
    lessonsByModuleId: new Map([[mod.id, [lessonA, lessonB]]]),
    currentLessonId: lessonA.id,
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

// A course the size of the real one: many modules, and the current lesson
// deep inside a late one. This is the shape that made the outline unable to
// show the learner where they were — the sidebar was taller than the
// viewport and opened on module 1.
const MODULE_COUNT = 14;
const LESSONS_PER_MODULE = 9;
const CURRENT_MODULE_INDEX = 11;
const CURRENT_LESSON_INDEX = 4;

const longCourseModules = Array.from({ length: MODULE_COUNT }, (_, index) =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId,
    slug: `module-${index + 1}`,
    title: `Module ${index + 1} — Pronunciation Step By Step`,
    sequence: index + 1,
  }),
);

const longCourseLessonsByModuleId = new Map(
  longCourseModules.map((module) => [
    module.id,
    Array.from({ length: LESSONS_PER_MODULE }, (_, index) =>
      Lesson.parse({
        kind: "video",
        id: LessonId.parse(faker.string.uuid()),
        courseId,
        moduleId: module.id,
        sequence: index + 1,
        title: `Exercise ${index + 1} Pronunciation Step By Step Lesson`,
        description: "d",
        source: faker.internet.url(),
        durationSeconds: 1605,
      }),
    ),
  ]),
);

const currentModule = longCourseModules[CURRENT_MODULE_INDEX] as Module;
const currentLesson = (longCourseLessonsByModuleId.get(currentModule.id) as Lesson[])[
  CURRENT_LESSON_INDEX
] as Lesson;

const longCourseArgs = {
  course,
  modules: longCourseModules,
  lessonsByModuleId: longCourseLessonsByModuleId,
  currentLessonId: currentLesson.id,
};

export const LongCourseDesktop: Story = {
  args: longCourseArgs,
  parameters: { viewport: { defaultViewport: "desktop" } },
  decorators: [
    // Mimics the lesson page: the outline is one column of a grid whose
    // other column is long enough to make the page scroll.
    (Story) => (
      <div className="grid gap-8 p-4 lg:grid-cols-[260px_1fr]">
        <Story />
        <div className="h-[3000px] rounded-2xl border border-border bg-card" />
      </div>
    ),
  ],
};

export const LongCourseMobile: Story = {
  args: longCourseArgs,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
