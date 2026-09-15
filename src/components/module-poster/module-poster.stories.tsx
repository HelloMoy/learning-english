import { LessonId } from "@/domain/entities/ids/ids";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModulePoster } from "./module-poster";

/** A real seed poster, so the collage shows artwork instead of empty frames. */
const POSTER =
  "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/1-intro/04ecdb-ec4d-8fea-d3f-dc020da6ec80-snapshot-554507553.jpeg";

const lessons = (count: number, withPoster = true) =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(`3c4d5e6f-7a8b-4c9d-8e0f-${String(index).padStart(12, "0")}`),
    sequence: index + 1,
    title: `Lesson ${index + 1}`,
    durationSeconds: 780,
    ...(withPoster ? { poster: POSTER } : {}),
  }));

const meta = {
  title: "Components/ModulePoster",
  component: ModulePoster,
  decorators: [
    (Story) => (
      <div className="h-[450px] w-[300px] overflow-hidden rounded-[18px]">
        <Story />
      </div>
    ),
  ],
  args: {
    sequence: 3,
    title: "Consonants",
    lessons: lessons(25),
    totalDurationSeconds: 19500,
    featured: true,
  },
} satisfies Meta<typeof ModulePoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The selected poster in the carousel: a three-image collage and large type. */
export const Featured: Story = {};

/** A neighbour poster: same artwork, smaller type. */
export const Neighbour: Story = { args: { featured: false } };

/** A one-video module shows its single image. */
export const SingleLesson: Story = {
  args: { title: "Fluidez y Velocidad", lessons: lessons(1), totalDurationSeconds: 1380 },
};

/** A module whose lessons have no artwork keeps a warm placeholder. */
export const WithoutArtwork: Story = { args: { lessons: lessons(4, false) } };
