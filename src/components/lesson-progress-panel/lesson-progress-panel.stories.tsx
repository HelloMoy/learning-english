import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonProgressPanel } from "./lesson-progress-panel";

const COMPLETED_KEY_PREFIX = "learning-english:completed:";
const PLAYBACK_KEY_PREFIX = "learning-english:playback:";

const course = Course.parse({
  id: CourseId.parse("d8f6a1f2-6f0e-4d4e-9b8f-1c2d3e4f5a6b"),
  slug: "basic-course",
  title: "Basic Course",
  description: "American pronunciation from the ground up.",
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
  sequence: 1,
});

const consonants = Module.parse({
  id: ModuleId.parse("0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d"),
  courseId: course.id,
  slug: "3-consonants",
  title: "Consonants",
  sequence: 3,
});

/** The real Consonants module's first lessons: title and runtime in seconds. */
const FIRST_LESSONS: ReadonlyArray<[string, number]> = [
  ["Ejercicio para activar las cuerdas vocales", 1324],
  ["Consonantes Plosivas y de Parada", 1801],
  ["/r/", 800],
  ["/Flap/", 787],
  ["Vocales Róticas", 2299],
  ["Dark /L/ Part 1", 1180],
  ["Dark /L/ Part 2", 2122],
];

const lessons = Array.from({ length: 25 }, (_, index) => {
  const [title, seconds] = FIRST_LESSONS[index] ?? [`Consonant drill ${index + 1}`, 600];
  return {
    id: LessonId.parse(`4d5e6f7a-8b9c-4d0e-9f1a-${String(index).padStart(12, "0")}`),
    sequence: index + 1,
    title,
    durationSeconds: seconds,
  };
});

const summary: ModuleSummary = {
  moduleId: consonants.id,
  lessonCount: lessons.length,
  totalDurationSeconds: lessons.reduce((total, lesson) => total + lesson.durationSeconds, 0),
  lessons,
};

/** Replaces this device's progress for the module before the story renders. */
function seedProgress({
  completed,
  positions,
}: {
  completed: number;
  positions?: [number, number];
}) {
  for (const lesson of lessons) {
    window.localStorage.removeItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`);
    window.localStorage.removeItem(`${PLAYBACK_KEY_PREFIX}${lesson.id}`);
  }
  for (const lesson of lessons.slice(0, completed)) {
    window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`, "1");
  }
  if (positions) {
    const [index, seconds] = positions;
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${lessons[index]!.id}`, String(seconds));
  }
}

const meta = {
  title: "Components/LessonProgressPanel",
  component: LessonProgressPanel,
  args: { course, module: consonants, summary },
} satisfies Meta<typeof LessonProgressPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing watched yet: one ring segment per video and Start this lesson. */
export const NotStarted: Story = {
  beforeEach: () => seedProgress({ completed: 0 }),
};

/** Three videos done, /Flap/ paused at 6:12: Continue with time left. */
export const InProgress: Story = {
  beforeEach: () => seedProgress({ completed: 3, positions: [3, 372] }),
};

/** Every video done: a full ring and Watch again. */
export const Completed: Story = {
  beforeEach: () => seedProgress({ completed: 25 }),
};
