import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { PendingButton } from "./pending-button";

/**
 * The submit button the four account forms share, taking its copy from the
 * active locale so the stories review the words a learner actually reads.
 */
function AccountSubmitButton({ isPending }: { isPending: boolean }) {
  const t = useTranslations("Account.signIn");

  return (
    <PendingButton
      type="submit"
      size="lg"
      className="h-11 w-full"
      isPending={isPending}
      label={t("submit")}
      pendingLabel={t("submitting")}
    />
  );
}

const meta = {
  title: "Components/PendingButton",
  component: AccountSubmitButton,
  args: { isPending: false },
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[22rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountSubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At rest: the ordinary label, no arc, pressable. */
export const Default: Story = {};

/** With its request in flight: label swapped, arc turning, disabled. */
export const Pending: Story = {
  args: { isPending: true },
};

/**
 * The profile page's delete button waits through this very same component —
 * different variant, different copy, identical behaviour.
 */
export const DestructivePending: Story = {
  render: function DeleteAccountButton() {
    const t = useTranslations("Profile.deleteAccount");
    return (
      <PendingButton
        type="button"
        variant="destructive"
        isPending
        className="min-h-11 px-5 font-bold"
        label={t("button")}
        pendingLabel={t("sending")}
      />
    );
  },
};

/** Spanish, to check the longer pending label still fits its button. */
export const PendingInSpanish: Story = {
  args: { isPending: true },
  parameters: { locale: "es" },
};

/** Portuguese. */
export const PendingInPortuguese: Story = {
  args: { isPending: true },
  parameters: { locale: "pt" },
};
