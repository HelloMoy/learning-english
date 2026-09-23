import { AccountShell } from "@/components/account-shell/account-shell";
import { Link } from "@/i18n/navigation";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountPageMain } from "../account-page-main";
import { accountPageMetadata } from "../account-page-metadata";
import { ForgetPendingPrize } from "./forget-pending-prize";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return accountPageMetadata("accountDeleted", locale);
}

/**
 * Where the deletion link lands, signed out: confirms the account is gone and
 * forgets what this device was still holding for it.
 */
export default async function AccountDeletedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Account" });

  return (
    <AccountPageMain>
      <ForgetPendingPrize />
      <AccountShell
        title={t("accountDeleted.title")}
        subtitle={t("accountDeleted.subtitle")}
      >
        <Link
          href="/"
          className="self-center font-medium text-foreground underline underline-offset-4"
        >
          {t("accountDeleted.homeLink")}
        </Link>
      </AccountShell>
    </AccountPageMain>
  );
}
