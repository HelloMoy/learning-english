import type { AccountSubmission } from "@/hooks/use-account-submission/use-account-submission";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { fn } from "storybook/test";

import { AccountSubmitArea } from "./account-submit-area";

type Args = { state: "ready" | "pending" | "refused" };

const SUBMISSIONS: Record<Args["state"], Partial<AccountSubmission>> = {
  ready: { isReady: true },
  pending: { isReady: false, isPending: true },
  refused: { isReady: true, errorKey: "invalidCredentials" },
};

/** The sign-in form's submit area in one of its states, with real copy. */
function SignInSubmitArea({ state }: Args) {
  const t = useTranslations("Account.signIn");
  const submission: AccountSubmission = {
    isReady: false,
    isPending: false,
    errorKey: undefined,
    challengeKey: 0,
    onToken: fn(),
    run: fn(),
    ...SUBMISSIONS[state],
  };
  return (
    <form className="flex w-80 flex-col gap-4">
      <AccountSubmitArea
        submission={submission}
        label={t("submit")}
        pendingLabel={t("submitting")}
      />
    </form>
  );
}

const meta = {
  title: "Components/AccountSubmitArea",
  component: SignInSubmitArea,
  args: { state: "ready" },
  argTypes: { state: { control: { type: "select" }, options: ["ready", "pending", "refused"] } },
} satisfies Meta<typeof SignInSubmitArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An enabled button. */
export const Ready: Story = {};

/** In flight: the button says so and is disabled. */
export const Pending: Story = { args: { state: "pending" } };

/** A refused attempt: the error is announced above the button. */
export const Refused: Story = { args: { state: "refused" } };
