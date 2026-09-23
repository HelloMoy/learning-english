import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AccountField } from "./account-field";

/** A password field with the app's real label, hint and error copy. */
function PasswordField({ withError }: { withError: boolean }) {
  const t = useTranslations("Account");
  const [value, setValue] = useState("");
  return (
    <div className="w-80">
      <AccountField
        name="password"
        type="password"
        label={t("fields.password")}
        hint={t("fields.passwordHint")}
        error={withError ? t("validation.passwordLength") : undefined}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

const meta = {
  title: "Components/AccountField",
  component: PasswordField,
  args: { withError: false },
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Label, input and hint. */
export const Default: Story = {};

/** An invalid value: the error is announced and linked to the input. */
export const WithError: Story = { args: { withError: true } };

/** Spanish copy. */
export const InSpanish: Story = { args: { withError: true }, parameters: { locale: "es" } };
