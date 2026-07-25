import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { CourseOverview } from "@/components/course-overview/course-overview";
import { CourseOverviewError } from "@/components/course-overview/course-overview-error";
import { Slug } from "@/domain/entities/slug/slug";

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
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const slugResult = Slug.safeParse(courseSlug);
  if (!slugResult.success) return { title: t("notFound") };
  const result = await loadCourseView(slugResult.data);
  if (result.isErr()) return { title: t("notFound") };
  return { title: result.value.course.title };
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
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8 sm:py-16"
    >
      <CourseOverview
        course={result.value.course}
        modules={result.value.modules}
        firstLesson={result.value.firstLesson}
      />
    </main>
  );
}
