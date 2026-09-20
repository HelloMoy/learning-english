import { AccountShell } from "@/components/account-shell/account-shell";
import { SignInForm } from "@/components/sign-in-form/sign-in-form";
import { Link } from "@/i18n/navigation";
import { redirectSignedInLearner } from "@/lib/auth/redirect-signed-in-learner/redirect-signed-in-learner";
import { resolveSignInReturn } from "@/lib/sign-in-return-path/sign-in-return-path";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountPageMain } from "../account-page-main";
import { accountPageMetadata } from "../account-page-metadata";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; reset?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return accountPageMetadata("signIn", locale);
}

/**
 * Sign-in. `next` is validated before anything uses it; a learner who is
 * already signed in goes straight there.
 */
export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next, reset } = await searchParams;
  const returnPath = resolveSignInReturn(next);
  await redirectSignedInLearner(locale, returnPath);
  const t = await getTranslations({ locale, namespace: "Account" });
  const nextQuery = next ? `?next=${encodeURIComponent(returnPath)}` : "";

  return (
    <AccountPageMain>
      <AccountShell
        title={t("signIn.title")}
        subtitle={t("signIn.subtitle")}
        footer={
          <p>
            {t("signIn.noAccount")}{" "}
            <Link
              href={`/sign-up${nextQuery}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("signIn.signUpLink")}
            </Link>
          </p>
        }
      >
        <SignInForm
          returnPath={returnPath}
          passwordUpdated={reset === "done"}
        />
      </AccountShell>
    </AccountPageMain>
  );
}
