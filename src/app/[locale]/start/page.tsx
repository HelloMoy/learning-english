import { OnboardingNameStep } from "@/components/onboarding-name-step/onboarding-name-step";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { currentAccount } from "@/lib/auth/current-account/current-account";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";

import { firstLearnerLevel, loadCatalogEntries } from "../catalog-levels";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return personalRouteMetadata({
    locale,
    href: "/start",
    title: t("startTitle"),
    description: t("startDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("startTitle") }),
  });
}

/**
 * Onboarding step 1. A thin shell: it names the first level for the learner
 * card, hands the step the name the account was created with, and lets the
 * client read the device's profile.
 */
export default function StartPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const first = firstLearnerLevel(use(loadCatalogEntries()));
  if (!first) notFound();

  // The layout has already refused a request without a session, so the only
  // account this can be missing is one signed out between the two reads.
  const account = use(currentAccount());

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <OnboardingNameStep
        level={first.level}
        videoCount={first.lessonRuntimes.length}
        accountName={account?.name ?? ""}
      />
    </main>
  );
}
