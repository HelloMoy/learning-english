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

/**
 * Onboarding step 1 hands the card the name field itself, so the learner types
 * where the name will live. The field belongs to the step; the card only makes
 * room for it.
 */
export const WithNameField: Story = {
  args: {
    name: "Ana García",
    nameField: (
      <input
        aria-label="Your name"
        defaultValue="Ana García"
        className="w-full min-w-0 truncate border-b border-dashed border-muted-foreground/50 bg-transparent pb-1 text-2xl leading-[1.05] font-extrabold tracking-tight text-foreground caret-gold transition-colors focus-visible:border-solid focus-visible:border-gold focus-visible:outline-none sm:text-3xl"
      />
    ),
  },
};

/** The same field before anything is typed. */
export const WithEmptyNameField: Story = {
  args: {
    name: "",
    nameField: (
      <input
        aria-label="Your name"
        defaultValue=""
        className="w-full min-w-0 truncate border-b border-dashed border-muted-foreground/50 bg-transparent pb-1 text-2xl leading-[1.05] font-extrabold tracking-tight text-foreground caret-gold transition-colors focus-visible:border-solid focus-visible:border-gold focus-visible:outline-none sm:text-3xl"
      />
    ),
  },
};

/** The card carrying the field, with Spanish chrome. */
export const WithNameFieldInSpanish: Story = {
  parameters: { locale: "es" },
  args: WithNameField.args,
};

/** The card carrying the field, with Portuguese chrome. */
export const WithNameFieldInPortuguese: Story = {
  parameters: { locale: "pt" },
  args: WithNameField.args,
};

/** The Profile page preview, wider and with progress. */
export const Large: Story = {
  args: {
    size: "large",
    progress: { completed: 6, total: 48 },
    avatar: { kind: "illustration", id: "plum" },
  },
};

/** Completing one course: the bronze finish and label. */
export const Bronze: Story = {
  args: { size: "large", distinction: "bronze", progress: { completed: 48, total: 48 } },
};

/** Completing every course: the gold finish and label. */
export const Gold: Story = {
  args: { size: "large", distinction: "gold", progress: { completed: 48, total: 48 } },
};

/** Gold in Spanish reads Oro. */
export const GoldInSpanish: Story = {
  parameters: { locale: "es" },
  args: { distinction: "gold", progress: { completed: 48, total: 48 } },
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
