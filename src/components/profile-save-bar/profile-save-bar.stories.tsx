import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ProfileSaveBar } from "./profile-save-bar";

const meta = {
  title: "Components/ProfileSaveBar",
  component: ProfileSaveBar,
  parameters: { layout: "fullscreen" },
  args: {
    state: "unsaved",
    canSave: true,
    onSave: fn(),
    onDiscard: fn(),
  },
  argTypes: {
    state: {
      control: { type: "select" },
      options: ["clean", "unsaved", "saving", "saved"],
    },
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-[16rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfileSaveBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bar as it appears the moment the learner changes their name or avatar. */
export const Unsaved: Story = {};

/** A blank name: the bar is up, but there is nothing valid to store. */
export const BlankName: Story = {
  args: { canSave: false },
};

/** Between the press and the answer, Save cannot be pressed twice. */
export const Saving: Story = {
  args: { state: "saving" },
};

/** After the save, the confirmation takes the controls' place. */
export const Saved: Story = {
  args: { state: "saved" },
};

/** Nothing edited: the bar draws nothing at all. */
export const Clean: Story = {
  args: { state: "clean" },
};

/** The unsaved bar in Spanish, where the line is longest. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** And in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
