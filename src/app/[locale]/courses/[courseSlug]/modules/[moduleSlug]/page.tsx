import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { ModuleOverview } from "@/components/module-overview/module-overview";
import { ModuleOverviewError } from "@/components/module-overview/module-overview-error";
import { StructuredData } from "@/components/structured-data/structured-data";
import { Slug } from "@/domain/entities/slug/slug";
import { requireSupportedLocale } from "@/i18n/require-supported-locale/require-supported-locale";
import { breadcrumbSchema } from "@/lib/course-schema/course-schema";
import { shareMetadata } from "@/lib/share-metadata/share-metadata";
import { siteUrl } from "@/lib/site-url/site-url";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

type Props = {
  params: Promise<{ locale: string; courseSlug: string; moduleSlug: string }>;
};

const loadModuleView = cache(
  async (courseSlug: ReturnType<typeof Slug.parse>, moduleSlug: ReturnType<typeof Slug.parse>) => {
    const deps = getCoursePlatformDeps();
    return deps.useCases.findModuleForView({ courseSlug, moduleSlug });
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, courseSlug, moduleSlug } = await params;
  requireSupportedLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const courseSlugResult = Slug.safeParse(courseSlug);
  const moduleSlugResult = Slug.safeParse(moduleSlug);
  if (!courseSlugResult.success || !moduleSlugResult.success) {
    return { title: t("notFound") };
  }
  const result = await loadModuleView(courseSlugResult.data, moduleSlugResult.data);
  if (result.isErr()) {
    return { title: t("notFound") };
  }

  const { course, module: courseModule, lessons } = result.value;
  const meta = await getTranslations({ locale, namespace: "Metadata" });
  return shareMetadata({
    locale,
    href: `/courses/${course.slug}/modules/${courseModule.slug}`,
    title: courseModule.title,
    description: meta("moduleDescription", {
      courseTitle: course.title,
      sequence: courseModule.sequence,
      moduleCount: course.moduleCount,
      lessonCount: lessons.length,
    }),
    siteName: meta("siteName"),
    imageAlt: meta("imageAlt", { title: courseModule.title }),
  });
}

export default async function ModuleOverviewPage({ params }: Props) {
  const { locale, courseSlug, moduleSlug } = await params;
  setRequestLocale(locale);
  const courseSlugResult = Slug.safeParse(courseSlug);
  const moduleSlugResult = Slug.safeParse(moduleSlug);
  if (!courseSlugResult.success || !moduleSlugResult.success) {
    return <ModuleOverviewError courseSlug={courseSlug} />;
  }
  const result = await loadModuleView(courseSlugResult.data, moduleSlugResult.data);
  if (result.isErr()) {
    return <ModuleOverviewError courseSlug={courseSlug} />;
  }
  const { course, module: courseModule } = result.value;
  const origin = siteUrl();
  const courseUrl = `${origin}/${locale}/courses/${course.slug}`;

  return (
    <main
      id="main"
      className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-11 sm:py-16"
    >
      <StructuredData
        data={breadcrumbSchema([
          { name: course.title, url: courseUrl },
          { name: courseModule.title, url: `${courseUrl}/modules/${courseModule.slug}` },
        ])}
      />
      <ModuleOverview
        course={result.value.course}
        module={result.value.module}
        lessons={result.value.lessons}
      />
    </main>
  );
}
