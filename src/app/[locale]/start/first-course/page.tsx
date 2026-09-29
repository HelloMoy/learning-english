import { FirstCourseStep } from "@/components/first-course-step/first-course-step";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { personalRouteMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";

import { loadCourseViews } from "../../course-views";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  requireSupportedLocale(locale);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return personalRouteMetadata({
    locale,
    href: "/start/first-course",
    title: t("firstCourseTitle"),
    description: t("firstCourseDescription"),
    siteName: t("siteName"),
    imageAlt: t("imageAlt", { title: t("firstCourseTitle") }),
  });
}

export default function StartFirstCoursePage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const [firstCourse] = use(loadCourseViews());
  if (!firstCourse) notFound();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-11 sm:py-16"
    >
      <FirstCourseStep course={firstCourse} />
    </main>
  );
}
