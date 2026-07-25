import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseCard } from "./course-card";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "107 lessons across 10 modules covering American English pronunciation.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
});
const firstLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId: course.id,
  moduleId: ModuleId.parse(faker.string.uuid()),
  sequence: 1,
  title: "Welcome",
  description: "Welcome to the course.",
  source:
    "/local-filesystem-lesson/advanced-intermediate-course/1-advanced-pronunciation-course/1-welcome/aprende-ingles-americano-con-fluidez-desde-cero.mp4",
  durationSeconds: 195,
  poster:
    "/local-filesystem-lesson/advanced-intermediate-course/1-advanced-pronunciation-course/1-welcome/02c51c4-2ab8-b82-fa2c-d2cd54856b0a-snapshot-210449.jpeg",
});

const meta: Meta<typeof CourseCard> = {
  title: "Components/CourseCard",
  component: CourseCard,
  args: {
    course,
    firstLesson,
    trackLabel: "Course modules in order",
  },
};

export default meta;

type Story = StoryObj<typeof CourseCard>;

export const EnglishWithPoster: Story = {};

export const SpanishWithoutPoster: Story = {
  args: {
    course: Course.parse({ ...course, title: "Curso Intermedio Avanzado" }),
    firstLesson: null,
  },
  parameters: { locale: "es" },
};

export const Empty: Story = {
  args: {
    course: Course.parse({ ...course, moduleCount: 0, lessonCount: 0 }),
    firstLesson: null,
  },
};
