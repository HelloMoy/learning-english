import { OnboardingAvatarStep } from "@/components/onboarding-avatar-step/onboarding-avatar-step";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";

import { firstLearnerLevel, loadCatalogEntries } from "../../catalog-levels";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return personalRouteMetadata({
    locale,
    href: "/start/avatar",
    title: t("startTitle"),
    description: t("startDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("startTitle") }),
  });
}

/** Onboarding step 2: the same learner card, now with the avatar picker. */
export default function StartAvatarPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const first = firstLearnerLevel(use(loadCatalogEntries()));
  if (!first) notFound();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <OnboardingAvatarStep
        level={first.level}
        videoCount={first.lessonRuntimes.length}
      />
    </main>
  );
}
