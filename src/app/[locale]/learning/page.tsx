import { MyLearningView } from "@/components/my-learning-view/my-learning-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { catalogLevels, loadCatalogEntries } from "../catalog-levels";
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
    href: "/learning",
    title: t("learningTitle"),
    description: t("learningDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("learningTitle") }),
  });
}

/**
 * My learning. A thin shell like the home: it resolves the catalog on the
 * server and hands the learner's page to the client, which reads the profile,
 * the continue-watching record and progress from this device.
 */
export default function MyLearningPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const entries = use(loadCatalogEntries());

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-4 py-10 sm:gap-28 sm:px-11 sm:py-16"
    >
      <MyLearningView
        levels={catalogLevels(entries)}
        firstLesson={homeFirstLesson(entries)}
      />
    </main>
  );
}
