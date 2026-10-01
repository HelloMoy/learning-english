import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import type { Course } from "@/domain/entities/course/course";
import { Slug } from "@/domain/entities/slug/slug";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { courseCopy } from "@/lib/course-copy/course-copy";
import { shareMetadata } from "@/lib/share-metadata/share-metadata";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

const findCourseView = cache(async (slug: ReturnType<typeof Slug.parse>) => {
  const deps = getCoursePlatformDeps();
  return deps.useCases.findCourseForView({ courseSlug: slug });
});

/**
 * The course a course route serves, or `null` when the slug is malformed or
 * names no course — the page then renders its error state.
 *
 * @remarks
 * Cached per request, so a page and its `generateMetadata` load it once.
 */
export async function loadCourseView(courseSlug: string): Promise<CourseForView | null> {
  const slugResult = Slug.safeParse(courseSlug);
  if (!slugResult.success) return null;
  const result = await findCourseView(slugResult.data);
  return result.isOk() ? result.value : null;
}

/**
 * The metadata every course route shares: the course title and description,
 * published under the route's own address.
 *
 * @param route - The request's locale and course slug, and the route's locale-less path builder
 */
export async function courseRouteMetadata(route: {
  locale: string;
  courseSlug: string;
  pathOf: (course: Pick<Course, "slug">) => string;
}): Promise<Metadata> {
  const { locale, courseSlug, pathOf } = route;
  requireSupportedLocale(locale);
  setRequestLocale(locale);
  const view = await loadCourseView(courseSlug);
  if (!view) {
    const t = await getTranslations({ locale, namespace: "HomePage" });
    return { title: t("notFound") };
  }

  const { course, modules } = view;
  const meta = await getTranslations({ locale, namespace: "Metadata" });
  return shareMetadata({
    locale,
    href: pathOf(course),
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
