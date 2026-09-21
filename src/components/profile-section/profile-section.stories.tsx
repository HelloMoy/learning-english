import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileSection } from "./profile-section";

const meta = {
  title: "Components/ProfileSection",
  component: ProfileSection,
  parameters: { layout: "padded" },
  args: {
    title: "Identity",
    children: (
      <div className="flex min-h-14 items-center rounded-xl border border-border bg-card px-[1.125rem] text-lg">
        Ana García
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[46rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfileSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A section whose heading says all there is to say. */
export const Titled: Story = {};

/** With the supporting line the Identity section carries. */
export const WithNote: Story = {
  args: { note: "Changes show on your card as you edit." },
};

/** The quieter framing the delete-account section takes at the end of the page. */
export const Quiet: Story = {
  args: {
    title: "Delete account",
    note: "Deletes your account and everything saved with it. This cannot be undone.",
    children: (
      <button
        type="button"
        className="min-h-11 self-start rounded-[0.625rem] border border-destructive/50 bg-destructive/15 px-5 text-[0.9375rem] font-bold text-destructive"
      >
        Delete account
      </button>
    ),
    className: "[&_h2]:text-base",
  },
};

/** Two sections in a row, so the rhythm between them can be judged. */
export const InSequence: Story = {
  render: (args) => (
    <div className="flex flex-col">
      <ProfileSection {...args} />
      <ProfileSection title="Preferences">
        <p className="text-sm text-muted-foreground">The language and theme rows.</p>
      </ProfileSection>
    </div>
  ),
};
