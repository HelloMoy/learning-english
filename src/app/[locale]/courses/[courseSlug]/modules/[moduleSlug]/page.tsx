import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { ModuleOverview } from "@/components/module-overview/module-overview";
import { ModuleOverviewError } from "@/components/module-overview/module-overview-error";
import { Slug } from "@/domain/entities/slug/slug";

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
  return { title: result.value.module.title };
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
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8 sm:py-16"
    >
      <ModuleOverview
        course={result.value.course}
        module={result.value.module}
        lessons={result.value.lessons}
      />
    </main>
  );
}
