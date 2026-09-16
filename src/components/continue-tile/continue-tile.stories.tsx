import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ContinueTile, type ContinueVideo } from "./continue-tile";

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

const vowels = Module.parse({
  id: ModuleId.parse("6c1d5b8f-2a4e-4d2f-8b66-1d9b2f3a4c52"),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 2,
});

const target = (kind: ContinueVideo["kind"]): ContinueVideo => ({
  kind,
  module: vowels,
  lessonNumber: 2,
  lesson: {
    id: LessonId.parse("7d2e6c9a-3b5f-4e3a-9c77-2eac3a4b5d22"),
    sequence: 2,
    title: "The Vowel Sound /ɪ/ (e corta)",
    durationSeconds: 535,
    poster: "/local-filesystem-lesson/basic-course/2-vowels/2-the-vowel-sound-ih/thumbnail.jpeg",
  },
});

const meta = {
  title: "Components/ContinueTile",
  component: ContinueTile,
  decorators: [
    (Story) => (
      <div style={{ width: 780 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    course,
    reading: { status: "read", target: target("continue"), videoCount: 17 },
  },
} satisfies Meta<typeof ContinueTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A returning learner: Continue where you left off. */
export const Continue: Story = {};

/** Nothing watched: Start course. */
export const Start: Story = {
  args: { reading: { status: "read", target: target("start"), videoCount: 17 } },
};

/** Everything watched: Watch again. */
export const Rewatch: Story = {
  args: { reading: { status: "read", target: target("rewatch"), videoCount: 17 } },
};

/** Before progress is read: placeholders of the text and action. */
export const Pending: Story = {
  args: { reading: { status: "pending" } },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
