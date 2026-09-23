import { ProfileView } from "@/components/profile-view/profile-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { currentAccount } from "@/lib/auth/current-account/current-account";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";

import { catalogLevels, firstLearnerLevel, loadCatalogEntries } from "../catalog-levels";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return personalRouteMetadata({
    locale,
    href: "/profile",
    title: t("profileTitle"),
    description: t("profileDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("profileTitle") }),
  });
}

/**
 * The Profile page: the learner card's editor, with the first level's
 * progress, and the account settings the session answers for.
 */
export default function ProfilePage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const entries = use(loadCatalogEntries());
  const first = firstLearnerLevel(entries);
  if (!first) notFound();

  // The layout has already refused a request without a session, so the only
  // account this can be missing is one signed out between the two reads.
  const account = use(currentAccount());

  // The save bar docks to the bottom of the viewport, so the page keeps that
  // much room under its last section whether or not the bar is up.
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-10 pb-32 sm:px-11 sm:pt-16 sm:pb-36"
    >
      <ProfileView
        level={first.level}
        lessonRuntimes={first.lessonRuntimes}
        levels={catalogLevels(entries)}
        account={account}
      />
    </main>
  );
}
