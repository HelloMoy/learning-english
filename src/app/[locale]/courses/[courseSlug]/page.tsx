import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { CourseDetailView } from "@/components/course-detail-view/course-detail-view";
import { CourseOverview } from "@/components/course-overview/course-overview";
import { CourseOverviewError } from "@/components/course-overview/course-overview-error";
import { CoursePageSwitch } from "@/components/course-page-switch/course-page-switch";
import { StructuredData } from "@/components/structured-data/structured-data";
import { Slug } from "@/domain/entities/slug/slug";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { courseCopy } from "@/lib/course-copy/course-copy";
import { breadcrumbSchema, courseSchema } from "@/lib/course-schema/course-schema";
import { shareMetadata } from "@/lib/share-metadata/share-metadata";
import { siteUrl } from "@/lib/site-url/site-url";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

type Props = {
  params: Promise<{ locale: string; courseSlug: string }>;
};

const loadCourseView = cache(async (slug: ReturnType<typeof Slug.parse>) => {
  const deps = getCoursePlatformDeps();
  return deps.useCases.findCourseForView({ courseSlug: slug });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, courseSlug } = await params;
  requireSupportedLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const slugResult = Slug.safeParse(courseSlug);
  if (!slugResult.success) return { title: t("notFound") };
  const result = await loadCourseView(slugResult.data);
  if (result.isErr()) return { title: t("notFound") };

  const { course, modules } = result.value;
  const meta = await getTranslations({ locale, namespace: "Metadata" });
  return shareMetadata({
    locale,
    href: `/courses/${course.slug}`,
    title: course.title,
    description: meta("courseDescription", {
      description: courseCopy(course, locale).description,
      moduleCount: modules.length,
      lessonCount: course.lessonCount,
    }),
    siteName: meta("siteName"),
    imageAlt: meta("imageAlt", { title: course.title }),
  });
}

export default async function CourseOverviewPage({ params }: Props) {
  const { locale, courseSlug } = await params;
  setRequestLocale(locale);
  const slugResult = Slug.safeParse(courseSlug);
  if (!slugResult.success) {
    return <CourseOverviewError />;
  }
  const result = await loadCourseView(slugResult.data);
  if (result.isErr()) {
    return <CourseOverviewError />;
  }
  const view = result.value;
  const { course } = view;
  const origin = siteUrl();
  const courseUrl = `${origin}/${locale}/courses/${course.slug}`;

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
