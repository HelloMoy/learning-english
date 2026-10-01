import { CourseDetailView } from "@/components/course-detail-view/course-detail-view";
import { CourseOverview } from "@/components/course-overview/course-overview";
import { CourseOverviewError } from "@/components/course-overview/course-overview-error";
import { CoursePageSwitch } from "@/components/course-page-switch/course-page-switch";
import { StructuredData } from "@/components/structured-data/structured-data";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { breadcrumbSchema, courseSchema } from "@/lib/course-schema/course-schema";
import { siteUrl } from "@/lib/site-url/site-url";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { courseRouteMetadata, loadCourseView } from "../course-route";

type Props = {
  params: Promise<{ locale: string; courseSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, courseSlug } = await params;
  return courseRouteMetadata({ locale, courseSlug, pathOf: courseOverviewPath });
}

export default async function CourseOverviewPage({ params }: Props) {
  const { locale, courseSlug } = await params;
  setRequestLocale(locale);
  const view = await loadCourseView(courseSlug);
  if (!view) {
    return <CourseOverviewError />;
  }
  const { course } = view;
  const origin = siteUrl();
  const courseUrl = `${origin}/${locale}${courseOverviewPath(course)}`;

  return (
    <main
      id="main"
      className="w-full"
    >
      <StructuredData data={courseSchema({ course, siteUrl: origin, locale })} />
      <StructuredData data={breadcrumbSchema([{ name: course.title, url: courseUrl }])} />
      <CoursePageSwitch
        courseSlug={course.slug}
        title={course.title}
        detail={<CourseDetailView view={view} />}
        board={
          <CourseOverview
            course={course}
            modules={view.modules}
            moduleSummaries={view.moduleSummaries}
          />
        }
      />
    </main>
  );
}
