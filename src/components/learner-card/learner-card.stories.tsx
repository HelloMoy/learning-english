import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { LearnerCard } from "./learner-card";

const meta = {
  title: "Components/LearnerCard",
  component: LearnerCard,
  args: {
    name: "Ana García",
    avatar: { kind: "initials" },
    level: { number: 1, courseTitle: "Basic Course" },
    progress: { completed: 0, total: 48 },
    size: "default",
  },
  argTypes: {
    size: { control: { type: "select" }, options: ["default", "large"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[560px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LearnerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card as onboarding step 1 fills it. */
export const WithName: Story = {};

/** Before anything is typed: the placeholder stands in for the name. */
export const Empty: Story = {
  args: { name: "" },
};

/** Step 2, after picking an illustration. */
export const WithIllustration: Story = {
  args: { avatar: { kind: "illustration", id: "echo" } },
};

/** The Profile page preview, wider and with progress. */
export const Large: Story = {
  args: {
    size: "large",
    progress: { completed: 6, total: 48 },
    avatar: { kind: "illustration", id: "plum" },
  },
};

/** A long name truncates rather than breaking the card. */
export const LongName: Story = {
  args: { name: "Maria Fernanda de los Santos Albuquerque" },
};

/** Portuguese chrome. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  args: { progress: { completed: 4, total: 48 } },
};

/** Hovering the progress line reveals the ring, the count and what is left of the course. */
export const ProgressTooltip: Story = {
  args: { progress: { completed: 4, total: 48 } },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("button", { name: "4 of 48 videos" }));
    await expect(await within(document.body).findByRole("tooltip")).toHaveTextContent(
      "44 to go in Basic Course",
    );
  },
};
