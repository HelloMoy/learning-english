import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { AccountShell } from "./account-shell";

/**
 * The card around every account page, shown with the sign-in page's real copy
 * so the locale toolbar translates it.
 */
function SignInCard({ withFooter }: { withFooter: boolean }) {
  const t = useTranslations("Account");
  return (
    <AccountShell
      title={t("signIn.title")}
      subtitle={t("signIn.subtitle")}
      footer={
        withFooter ? (
          <p>
            {t("signIn.noAccount")} <a href="#">{t("signIn.signUpLink")}</a>
          </p>
        ) : undefined
      }
    >
      <div className="h-40 rounded-lg border border-dashed border-border" />
    </AccountShell>
  );
}

const meta = {
  title: "Components/AccountShell",
  component: SignInCard,
  args: { withFooter: true },
} satisfies Meta<typeof SignInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Heading, subtitle, content and the footer link to the neighbouring page. */
export const Default: Story = {};

/** Without a footer, as the confirmation states render. */
export const WithoutFooter: Story = { args: { withFooter: false } };

/** Portuguese copy. */
export const InPortuguese: Story = { parameters: { locale: "pt" } };

/** Phone width. */
export const OnAPhone: Story = { globals: { viewport: { value: "mobile2" } } };
