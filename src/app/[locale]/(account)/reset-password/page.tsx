import { AccountShell } from "@/components/account-shell/account-shell";
import { ResetPasswordForm } from "@/components/reset-password-form/reset-password-form";
import { redirectSignedInLearner } from "@/lib/auth/redirect-signed-in-learner/redirect-signed-in-learner";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountPageMain } from "../account-page-main";
import { accountPageMetadata } from "../account-page-metadata";

type Props = {
  params: Promise<{ locale: string }>;
  /** Better Auth sends `token` for a live link and `error` for a dead one. */
  searchParams: Promise<{ token?: string; error?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return accountPageMetadata("resetPassword", locale);
}

/** Reset password: where the emailed link lands. */
export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, error } = await searchParams;
  await redirectSignedInLearner(locale, "/learning");
  const t = await getTranslations({ locale, namespace: "Account" });

  return (
    <AccountPageMain>
      <AccountShell
        title={t("resetPassword.title")}
        subtitle={t("resetPassword.subtitle")}
      >
        <ResetPasswordForm token={error ? undefined : token} />
      </AccountShell>
    </AccountPageMain>
  );
}
