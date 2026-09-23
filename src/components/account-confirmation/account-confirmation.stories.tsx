import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { AccountConfirmation } from "./account-confirmation";

/** The two confirmations the account pages show, with their real copy. */
function Confirmation({ kind }: { kind: "checkInbox" | "invalidLink" }) {
  const t = useTranslations("Account");
  if (kind === "checkInbox") {
    return (
      <AccountConfirmation
        title={t("signUp.checkInboxTitle")}
        message={t("signUp.checkInboxBody", { email: "ana@example.com" })}
      />
    );
  }
  return (
    <AccountConfirmation
      title={t("resetPassword.invalidTitle")}
      message={t("resetPassword.invalidBody")}
      action={<a href="#">{t("resetPassword.requestNew")}</a>}
    />
  );
}

const meta = {
  title: "Components/AccountConfirmation",
  component: Confirmation,
  args: { kind: "checkInbox" },
} satisfies Meta<typeof Confirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** After sign-up: the address the link went to. */
export const CheckInbox: Story = {};

/** A spent reset link, with the way to a new one. */
export const InvalidLink: Story = { args: { kind: "invalidLink" } };

/** Spanish copy. */
export const InSpanish: Story = { parameters: { locale: "es" } };
