import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StartPanel } from "./start-panel";

const meta = {
  title: "Components/StartPanel",
  component: StartPanel,
  args: {
    firstLessonHref:
      "/courses/basic-course/modules/1-introduction/lessons/00000000-0000-4000-8000-000000000001",
    firstLessonMinutes: 8,
    courseTitle: "Basic Course",
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StartPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who has onboarded but not watched anything yet. */
export const Default: Story = {};

/** A first lesson with no runtime. */
export const WithoutDuration: Story = {
  args: { firstLessonMinutes: null },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
