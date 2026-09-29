import { AvailableCoursesView } from "@/components/available-courses-view/available-courses-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { loadCourseViews } from "../course-views";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return personalRouteMetadata({
    locale,
    href: "/courses",
    title: t("coursesTitle"),
    description: t("coursesDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("coursesTitle") }),
  });
}

export default function AvailableCoursesPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const courses = use(loadCourseViews());

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <AvailableCoursesView courses={courses} />
    </main>
  );
}
