import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseCarousel } from "./course-carousel";

const COMPLETED_KEY_PREFIX = "learning-english:completed:";

/** A real seed poster, so every collage shows artwork instead of empty frames. */
const POSTER =
  "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/1-intro/04ecdb-ec4d-8fea-d3f-dc020da6ec80-snapshot-554507553.jpeg";

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

/** The Basic Course's real modules: title, lesson count and runtime in minutes. */
const REAL_MODULES: ReadonlyArray<[string, number, number]> = [
  ["Introduction", 1, 8],
  ["Vowels", 17, 159],
  ["Consonants", 25, 325],
  ["Ejercicios para dominar el ritmo en Inglés", 4, 114],
  ["Fluidez y Velocidad", 1, 23],
];

const modules = REAL_MODULES.map(([title], index) =>
  Module.parse({
    id: ModuleId.parse(`5e6f7a8b-9c0d-4e1f-8a2b-${String(index).padStart(12, "0")}`),
    courseId: course.id,
    slug: `${index + 1}-module`,
    title,
    sequence: index + 1,
  }),
);

const moduleSummaries: ModuleSummary[] = modules.map((module, index) => {
  const [, lessonCount, minutes] = REAL_MODULES[index]!;
  const perLesson = Math.round((minutes * 60) / lessonCount);
  return {
    moduleId: module.id,
    lessonCount,
    totalDurationSeconds: minutes * 60,
    lessons: Array.from({ length: lessonCount }, (_, lessonIndex) => ({
      id: LessonId.parse(
        `6f7a8b9c-0d1e-4f2a-9b3c-${String(index * 100 + lessonIndex).padStart(12, "0")}`,
      ),
      sequence: lessonIndex + 1,
      title: `${module.title} · video ${lessonIndex + 1}`,
      durationSeconds: perLesson,
      poster: POSTER,
    })),
  };
});

/** Clears this device's completion marks for the story's lessons, then marks the given ones. */
function seedCompleted(lessonIds: ReadonlyArray<string>) {
  for (const summary of moduleSummaries) {
    for (const lesson of summary.lessons) {
      window.localStorage.removeItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`);
    }
  }
  for (const id of lessonIds) window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${id}`, "1");
}

const meta = {
  title: "Components/CourseCarousel",
  component: CourseCarousel,
  parameters: { layout: "fullscreen" },
  args: { course, modules, moduleSummaries },
} satisfies Meta<typeof CourseCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who has not started: the first module is selected. */
export const NotStarted: Story = {
  beforeEach: () => seedCompleted([]),
};

/** Three Consonants videos done: the carousel opens on Consonants with Continue. */
export const ResumesModuleInProgress: Story = {
  beforeEach: () =>
    seedCompleted(moduleSummaries[2]!.lessons.slice(0, 3).map((lesson) => lesson.id)),
};
