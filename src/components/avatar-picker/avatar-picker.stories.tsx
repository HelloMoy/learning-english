import type { LearnerAvatar } from "@/domain/entities/learner-profile/learner-profile";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { AvatarPicker } from "./avatar-picker";

const meta = {
  title: "Components/AvatarPicker",
  component: AvatarPicker,
  args: { name: "Ana García", value: { kind: "initials" }, onChange: () => {} },
  render: function ControlledPicker(args) {
    const [avatar, setAvatar] = useState<LearnerAvatar>(args.value);
    return (
      <AvatarPicker
        {...args}
        value={avatar}
        onChange={setAvatar}
      />
    );
  },
} satisfies Meta<typeof AvatarPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing chosen yet: the initials are checked. */
export const InitialsChecked: Story = {};

/** An illustration already on the card. */
export const IllustrationChecked: Story = {
  args: { value: { kind: "illustration", id: "ember" } },
};

/** Pressing Plum checks it and unchecks the initials. */
export const PickingAnIllustration: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plum = canvas.getByRole("radio", { name: "Plum" });

    await userEvent.click(plum);

    await expect(plum).toHaveAttribute("aria-checked", "true");
  },
};

/** The phone layout: three columns. */
export const Phone: Story = {
  globals: { viewport: { value: "mobile1" } },
  decorators: [
    (Story) => (
      <div className="max-w-[390px]">
        <Story />
      </div>
    ),
  ],
};

/** Spanish illustration names. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
