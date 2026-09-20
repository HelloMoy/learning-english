import { AccountShell } from "@/components/account-shell/account-shell";
import { SignUpForm } from "@/components/sign-up-form/sign-up-form";
import { Link } from "@/i18n/navigation";
import { redirectSignedInLearner } from "@/lib/auth/redirect-signed-in-learner/redirect-signed-in-learner";
import { resolveSignInReturn } from "@/lib/sign-in-return-path/sign-in-return-path";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountPageMain } from "../account-page-main";
import { accountPageMetadata } from "../account-page-metadata";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return accountPageMetadata("signUp", locale);
}

/**
 * Sign-up. The verification link returns to the validated `next`, so a
 * learner who followed a course link lands on that course once verified.
 */
export default async function SignUpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const returnPath = resolveSignInReturn(next);
  await redirectSignedInLearner(locale, returnPath);
  const t = await getTranslations({ locale, namespace: "Account" });
  const nextQuery = next ? `?next=${encodeURIComponent(returnPath)}` : "";

  return (
    <AccountPageMain>
      <AccountShell
        title={t("signUp.title")}
        subtitle={t("signUp.subtitle")}
        footer={
          <p>
            {t("signUp.haveAccount")}{" "}
            <Link
              href={`/sign-in${nextQuery}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("signUp.signInLink")}
            </Link>
          </p>
        }
      >
        <SignUpForm returnPath={returnPath} />
      </AccountShell>
    </AccountPageMain>
  );
}
