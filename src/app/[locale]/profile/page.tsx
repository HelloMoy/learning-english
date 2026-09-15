import { ProfileView } from "@/components/profile-view/profile-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
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
    href: "/profile",
    title: t("profileTitle"),
    description: t("profileDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("profileTitle") }),
  });
}

/** The Profile page: the learner card's editor, with the first level's progress. */
export default function ProfilePage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const first = firstLearnerLevel(use(loadCatalogEntries()));
  if (!first) notFound();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <ProfileView
        level={first.level}
        lessonRuntimes={first.lessonRuntimes}
      />
    </main>
  );
}
