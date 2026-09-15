import { HomeView } from "@/components/home-view/home-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { shareMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { catalogLevels, loadCatalogEntries } from "./catalog-levels";
import { homeFirstLesson } from "./home-first-lesson";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const home = await getTranslations({ locale, namespace: "HomePage" });
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return shareMetadata({
    locale,
    href: "/",
    title: home("title"),
    description: t("homeDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: home("title") }),
  });
}

/**
 * The locale home route. A thin shell: it resolves the catalog through the
 * use case and hands `HomeView` every course with its modules and lesson
 * progress slices, and the first lesson the closing band's offer is sized by —
 * mirroring how the course and module routes delegate to `CourseOverview` and
 * `ModuleOverview`.
 *
 * Lesson bodies stay on the server: only the progress slices and the first
 * lesson's href, runtime and course title cross into the client payload.
 */
export default function Home({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const entries = use(loadCatalogEntries());
  const levels = catalogLevels(entries);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-4 py-12 sm:gap-28 sm:px-11 sm:py-20"
    >
      <HomeView
        levels={levels}
        firstLesson={homeFirstLesson(entries)}
      />
    </main>
  );
}
