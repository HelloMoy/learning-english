import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url/site-url";

import type { MetadataRoute } from "next";

/**
 * Every servable URL, in every locale, with its locale alternates.
 *
 * @remarks
 * Built by walking the domain use cases, never by reading `src/content/*.json`.
 * The manifests are the unfiltered source and list draft courses; the use cases
 * apply the catalog's withholding. A sitemap that advertises a URL rendering a
 * not-found state is worse than one that omits it, so the filtering has to be
 * inherited rather than restated here.
 *
 * Each entry restates its locale alternates. The pages already declare them in
 * their heads, but a crawler reads the sitemap first and should not have to
 * fetch three pages to learn they are the same content.
 *
 * @returns One entry per route per locale
 * @category Metadata
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const { useCases } = getCoursePlatformDeps();

  const catalog = await useCases.findCourseCatalog();
  const courses = catalog.isOk() ? catalog.value.entries.map((entry) => entry.course) : [];

  const paths: string[] = ["/"];

  for (const course of courses) {
    const coursePath = `/courses/${course.slug}`;
    paths.push(coursePath);

    const view = await useCases.findCourseForView({ courseSlug: course.slug });
    if (view.isErr()) continue;

    for (const courseModule of view.value.modules) {
      const modulePath = `${coursePath}/modules/${courseModule.slug}`;
      paths.push(modulePath);

      const moduleView = await useCases.findModuleForView({
        courseSlug: course.slug,
        moduleSlug: courseModule.slug,
      });
      if (moduleView.isErr()) continue;

      for (const lesson of moduleView.value.lessons) {
        paths.push(`${modulePath}/lessons/${lesson.id}`);
      }
    }
  }

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absolute(origin, locale, path),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alternate) => [alternate, absolute(origin, alternate, path)]),
        ),
      },
    })),
  );
}

/** The absolute URL of `path` under `locale`. Mirrors the canonical the page declares. */
function absolute(origin: string, locale: string, path: string): string {
  return `${origin}/${locale}${path === "/" ? "" : path}`;
}
