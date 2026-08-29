import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleList } from "./module-list";

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "english-a1-pronunciation",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
});
const modA = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "vowels-and-video-intro",
  title: "Vowels",
  sequence: 1,
});
const modB = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "consonants-and-stress",
  title: "Consonants",
  sequence: 2,
});
const lessonA1 = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: modA.id,
  sequence: 1,
  title: "Vowels video",
  description: "d",
  source: faker.internet.url(),
  durationSeconds: 600,
});
const lessonB1 = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: modB.id,
  sequence: 1,
  title: "Consonant reading",
  body: "body",
});

const map = new Map<string, Lesson[]>([
  [modA.id, [lessonA1]],
  [modB.id, [lessonB1]],
]);

/**
 * A third module plus extra lessons per module, so the disclosure has
 * something worth revealing: the collapsed rows are the point of the story.
 */
const modC = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "intonation-and-rhythm",
  title: "Intonation",
  sequence: 3,
});

function readingLesson(module: Module, sequence: number, title: string): Lesson {
  return Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId: module.id,
    sequence,
    title,
    body: "body",
  });
}

const lessonA2 = readingLesson(modA, 2, "Vowel drills");
const lessonB2 = readingLesson(modB, 2, "Consonant clusters");
const lessonC1 = readingLesson(modC, 1, "Sentence stress");
const lessonC2 = readingLesson(modC, 2, "Pitch contours");

const threeModuleMap = new Map<string, Lesson[]>([
  [modA.id, [lessonA1, lessonA2]],
  [modB.id, [lessonB1, lessonB2]],
  [modC.id, [lessonC1, lessonC2]],
]);

const meta = {
  title: "LessonView/ModuleList",
  component: ModuleList,
} satisfies Meta<typeof ModuleList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoModules: Story = {
  args: {
    course,
    modules: [modA, modB],
    lessonsByModuleId: map,
    currentLessonId: lessonA1.id,
  },
};

export const OneModule: Story = {
  args: {
    course,
    modules: [modA],
    lessonsByModuleId: new Map([[modA.id, [lessonA1]]]),
    currentLessonId: lessonA1.id,
  },
};

/**
 * The disclosure's default state: the current lesson's module is expanded,
 * the other two are collapsed behind their chevrons. Click any collapsed
 * title to expand it — the others stay as they are, several can be open at
 * once, and none of them navigates away.
 */
export const CollapsedModules: Story = {
  args: {
    course,
    modules: [modA, modB, modC],
    lessonsByModuleId: threeModuleMap,
    currentLessonId: lessonA1.id,
  },
};
