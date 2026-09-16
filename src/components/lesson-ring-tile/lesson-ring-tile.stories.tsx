import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonRingTile } from "./lesson-ring-tile";

const course = Course.parse({
  id: CourseId.parse("5b0c4a7e-1f3d-4c1e-9a55-0c8a1e2f3b4d"),
  slug: "basic-course",
  title: "Basic Course",
  description: "The sounds of American English.",
  language: "en",
  lessonCount: 17,
  moduleCount: 5,
  sequence: 1,
});

const POSTER =
  "/local-filesystem-lesson/basic-course/2-vowels/1-the-vowel-sound-schwa/thumbnail.jpeg";

const lessonOf = (title: string, lessonCount: number, sequence = 2) => {
  const courseModule = Module.parse({
    id: ModuleId.parse(`6c1d5b8f-2a4e-4d2f-8b66-1d9b2f3a4c5${sequence}`),
    courseId: course.id,
    slug: `${sequence}-lesson`,
    title,
    sequence,
  });
  const summary: ModuleSummary = {
    moduleId: courseModule.id,
    lessonCount,
    totalDurationSeconds: lessonCount * 560,
    lessons: Array.from({ length: lessonCount }, (_, index) => ({
      id: LessonId.parse(`7d2e6c9a-3b5f-4e3a-9c77-2eac3a4b5${String(index).padStart(3, "0")}`),
      sequence: index + 1,
      title: `Video ${index + 1}`,
      durationSeconds: 560,
      poster: POSTER,
    })),
  };
  return { module: courseModule, summary };
};

const vowels = lessonOf("Vowels", 17);

const meta = {
  title: "Components/LessonRingTile",
  component: LessonRingTile,
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    course,
    ...vowels,
    reading: {
      status: "read",
      progress: {
        ...vowels,
        completedCount: 1,
        lessonCount: 17,
        completedFraction: 1 / 17,
        secondsLeft: 144 * 60,
        status: "in-progress",
        isCurrent: true,
      },
    },
  },
} satisfies Meta<typeof LessonRingTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The lesson the learner is in: gold edge, partly filled ring, time left. */
export const InProgress: Story = {};

/** Every video watched: full ring and "All watched". */
export const Completed: Story = {
  args: {
    reading: {
      status: "read",
      progress: {
        ...vowels,
        completedCount: 17,
        lessonCount: 17,
        completedFraction: 1,
        secondsLeft: 0,
        status: "completed",
        isCurrent: false,
      },
    },
  },
};

/** Nothing watched yet: empty ring with 0 % and the whole runtime left. */
export const NotStarted: Story = {
  args: {
    reading: {
      status: "read",
      progress: {
        ...vowels,
        completedCount: 0,
        lessonCount: 17,
        completedFraction: 0,
        secondsLeft: 17 * 560,
        status: "not-started",
        isCurrent: false,
      },
    },
  },
};

/**
 * Every video watched and the prize claimed on the counter: the toy is drawn in
 * colour. Completing the lesson alone leaves it a silhouette — see `Completed`.
 */
export const PrizeClaimed: Story = {
  args: {
    isPrizeClaimed: true,
    reading: {
      status: "read",
      progress: {
        ...vowels,
        completedCount: 17,
        lessonCount: 17,
        completedFraction: 1,
        secondsLeft: 0,
        status: "completed",
        isCurrent: false,
      },
    },
  },
};

/** Before this device's progress is read: size and runtime only, no ring fill. */
export const Pending: Story = {
  args: { reading: { status: "pending" } },
};

/** On a phone the tile becomes a row led by its ring. */
export const PhoneRow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
  globals: { viewport: { value: "mobile1" } },
};

/** The same tile with Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
