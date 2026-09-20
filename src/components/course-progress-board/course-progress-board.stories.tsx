import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseProgressBoard } from "./course-progress-board";

const course = Course.parse({
  id: CourseId.parse("5b0c4a7e-1f3d-4c1e-9a55-0c8a1e2f3b4d"),
  slug: "basic-course",
  title: "Basic Course",
  description: "The sounds of American English.",
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
  sequence: 1,
});

/** The real course's shape: title, folder, video count and total minutes per lesson. */
const LESSONS: ReadonlyArray<[string, string, number, number]> = [
  ["Introduction", "1-introduction/1-introduction", 1, 8],
  ["Vowels", "2-vowels/1-the-vowel-sound-schwa", 17, 159],
  ["Consonants", "3-consonants/1-activar-las-cuerdas-vocales", 25, 325],
  [
    "Ejercicios para dominar el ritmo en Inglés",
    "4-ejercicios-para-dominar-el-ritmo-en-ingles/1-afina-tu-oido-y-pronunciacion",
    4,
    114,
  ],
  [
    "Fluidez y Velocidad",
    "5-fluidez-y-velocidad/1-ejercita-las-vocales-y-la-flap-con-esta-cancion",
    1,
    23,
  ],
];

const modules = LESSONS.map(([title], index) =>
  Module.parse({
    id: ModuleId.parse(`6c1d5b8f-2a4e-4d2f-8b66-1d9b2f3a4c5${index}`),
    courseId: course.id,
    slug: `${index + 1}-lesson`,
    title,
    sequence: index + 1,
  }),
);

const moduleSummaries: ModuleSummary[] = modules.map((module, index) => {
  const [, folder, count, minutes] = LESSONS[index]!;
  return {
    moduleId: module.id,
    lessonCount: count,
    totalDurationSeconds: minutes * 60,
    lessons: Array.from({ length: count }, (_, lessonIndex) => ({
      id: LessonId.parse(
        `7d2e6c9a-3b5f-4e3a-9c77-2eac3a4b${index}${String(lessonIndex).padStart(3, "0")}`,
      ),
      sequence: lessonIndex + 1,
      title: `Video ${lessonIndex + 1}`,
      durationSeconds: Math.round((minutes * 60) / count),
      poster:
        lessonIndex === 0
          ? `/local-filesystem-lesson/basic-course/${folder}/thumbnail.jpeg`
          : undefined,
    })),
  };
});

const storedLocation = (location: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => location,
  set: async () => {},
});

const meta = {
  title: "Components/CourseProgressBoard",
  component: CourseProgressBoard,
  parameters: { layout: "fullscreen" },
  args: { course, modules, moduleSummaries, continueWatching: storedLocation(null) },
  beforeEach: () => {
    resetLearnerStore();
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof CourseProgressBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who has watched nothing: 0 % everywhere and Start course. */
export const NewLearner: Story = {};

/** Introduction finished and the second Vowels video recorded: Vowels is the lesson in progress. */
export const ReturningLearner: Story = {
  args: {
    continueWatching: storedLocation(
      ContinueWatchingLocation.parse({
        courseSlug: course.slug,
        moduleSlug: "2-lesson",
        lessonId: moduleSummaries[1]!.lessons[1]!.id,
      }),
    ),
  },
  beforeEach: () => {
    givenLearner.completed(
      [...moduleSummaries[0]!.lessons, moduleSummaries[1]!.lessons[0]!].map((lesson) => lesson.id),
    );
  },
};

/** The same returning learner with Spanish copy. */
export const InSpanish: Story = {
  ...ReturningLearner,
  parameters: { locale: "es" },
};
