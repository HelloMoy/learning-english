import { StartCourseLink } from "@/components/start-course-link/start-course-link";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StartHereBand } from "./start-here-band";

const meta = {
  title: "Components/StartHereBand",
  component: StartHereBand,
  args: {
    firstLessonMinutes: 8,
    action: <StartCourseLink />,
  },
} satisfies Meta<typeof StartHereBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The landing's closing band. */
export const Default: Story = {};

/** A first lesson with no runtime. */
export const WithoutDuration: Story = {
  args: { firstLessonMinutes: null },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
