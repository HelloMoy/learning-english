import { AccountField } from "@/components/account-field/account-field";
import { PendingButton } from "@/components/pending-button/pending-button";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { AccountWait } from "./account-wait";

/**
 * The account card, reproduced with `AccountShell`'s own classes so the beam
 * has the positioning context and the clipping it has in the app.
 */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative mx-auto flex w-full max-w-[26rem] flex-col gap-6 overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
      {children}
    </section>
  );
}

/** A sign-in form, frozen at whichever half of the wait the story is showing. */
function SignInCard({ busy }: { busy: boolean }) {
  const t = useTranslations("Account");

  return (
    <Card>
      <AccountWait busy={busy}>
        <header className="flex flex-col gap-2 text-center">
          <h1 className="font-sans text-[1.75rem] leading-tight font-extrabold tracking-tight text-foreground">
            {t("signIn.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("signIn.subtitle")}</p>
        </header>
        <AccountWait.Paused className="flex flex-col gap-4">
          <AccountField
            name="email"
            type="email"
            label={t("fields.email")}
            value="ana@correo.com"
            onChange={() => {}}
          />
          <AccountField
            name="password"
            type="password"
            label={t("fields.password")}
            value="a-very-secret-one"
            onChange={() => {}}
          />
        </AccountWait.Paused>
        <PendingButton
          type="submit"
          size="lg"
          className="h-11 w-full"
          isPending={busy}
          label={t("signIn.submit")}
          pendingLabel={t("signIn.submitting")}
        />
        <AccountWait.Status>{t("signIn.waiting")}</AccountWait.Status>
      </AccountWait>
    </Card>
  );
}

const meta = {
  title: "Components/AccountWait",
  component: SignInCard,
  args: { busy: true },
  parameters: { layout: "centered" },
} satisfies Meta<typeof SignInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The wait as a learner sees it: the beam crossing the top of the card, the
 * fields dimmed and inert behind, the button turning its arc, and the sentence
 * naming what is being waited on.
 */
export const Waiting: Story = {};

/** The same card at rest, for comparison — nothing of the wait shows. */
export const Idle: Story = {
  args: { busy: false },
};

/** Spanish, where the pending label and the sentence are both longest. */
export const WaitingInSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese. */
export const WaitingInPortuguese: Story = {
  parameters: { locale: "pt" },
};

/**
 * A surface with nothing to pause — the profile page's delete section, which
 * has a button and a sentence but no fields.
 */
export const WithoutAPausedRegion: Story = {
  render: function DeleteSection() {
    const t = useTranslations("Profile.deleteAccount");
    return (
      <Card>
        <AccountWait busy>
          <h2 className="text-lg font-bold text-foreground">{t("heading")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <PendingButton
            type="button"
            variant="destructive"
            isPending
            className="min-h-11 self-start px-5 font-bold"
            label={t("button")}
            pendingLabel={t("sending")}
          />
          <AccountWait.Status>{t("waiting")}</AccountWait.Status>
        </AccountWait>
      </Card>
    );
  },
};
