import { CourseDetailView } from "@/components/course-detail-view/course-detail-view";
import { CourseOverviewError } from "@/components/course-overview/course-overview-error";
import { CoursePageGate } from "@/components/course-page-gate/course-page-gate";
import { courseDetailPath } from "@/i18n/lesson-routes";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { courseRouteMetadata, loadCourseView } from "../course-route";

type Props = {
  params: Promise<{ locale: string; courseSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, courseSlug } = await params;
  return courseRouteMetadata({ locale, courseSlug, pathOf: courseDetailPath });
}

export default async function CourseDetailPage({ params }: Props) {
  const { locale, courseSlug } = await params;
  setRequestLocale(locale);
  const view = await loadCourseView(courseSlug);
  if (!view) {
    return <CourseOverviewError />;
  }

  return (
    <main
      id="main"
      className="w-full"
    >
      <CoursePageGate title={view.course.title}>
        <CourseDetailView view={view} />
      </CoursePageGate>
    </main>
  );
}
