import { AchievementsView } from "@/components/achievements-view/achievements-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";

import { catalogLevels, firstLearnerLevel, loadCatalogEntries } from "../catalog-levels";
import { homeFirstLesson } from "../home-first-lesson";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return personalRouteMetadata({
    locale,
    href: "/achievements",
    title: t("achievementsTitle"),
    description: t("achievementsDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("achievementsTitle") }),
  });
}

/**
 * The Achievements page. A thin shell like My learning: it resolves the catalog
 * on the server and hands the learner's collection to the client, which derives
 * it from this device's progress.
 */
export default function AchievementsPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const entries = use(loadCatalogEntries());
  const first = firstLearnerLevel(entries);
  if (!first) notFound();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <AchievementsView
        level={first.level}
        lessonRuntimes={first.lessonRuntimes}
        levels={catalogLevels(entries)}
        firstLesson={homeFirstLesson(entries)}
      />
    </main>
  );
}
