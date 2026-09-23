import { AccountShell } from "@/components/account-shell/account-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form/forgot-password-form";
import { Link } from "@/i18n/navigation";
import { redirectSignedInLearner } from "@/lib/auth/redirect-signed-in-learner/redirect-signed-in-learner";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountPageMain } from "../account-page-main";
import { accountPageMetadata } from "../account-page-metadata";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return accountPageMetadata("forgotPassword", locale);
}

/** Forgot password: asks for the address a reset link should go to. */
export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await redirectSignedInLearner(locale, "/learning");
  const t = await getTranslations({ locale, namespace: "Account" });

  return (
    <AccountPageMain>
      <AccountShell
        title={t("forgotPassword.title")}
        subtitle={t("forgotPassword.subtitle")}
        footer={
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline underline-offset-4"
          >
            {t("forgotPassword.backToSignIn")}
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AccountShell>
    </AccountPageMain>
  );
}
