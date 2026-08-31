import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import type { CourseLevel } from "@/components/course-ladder/course-ladder";
import { HomeView } from "@/components/home-view/home-view";

import { setRequestLocale } from "next-intl/server";
import { cache, use } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const loadCatalog = cache(async () => {
  const deps = getCoursePlatformDeps();
  const result = await deps.useCases.findCourseCatalog();
  return result.isOk() ? result.value.entries : [];
});

/**
 * The locale home route. A thin shell: it resolves the catalog through the
 * use case and hands the levels to `HomeView`, mirroring how the course and
 * module routes delegate to `CourseOverview` and `ModuleOverview`.
 *
 * Only the fields the ladder renders cross into the view — the catalog's
 * `firstLesson` stays here, unread, rather than being serialized into the
 * client payload for a card that never shows it.
 */
export default function Home({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const entries = use(loadCatalog());
  const levels: CourseLevel[] = entries.map((entry) => ({
    course: entry.course,
    leadingModules: entry.leadingModules,
  }));

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-14 px-4 py-12 sm:px-11 sm:py-20"
    >
      <HomeView levels={levels} />
    </main>
  );
}
