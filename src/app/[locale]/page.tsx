import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { CinemaHero } from "@/components/cinema-hero/cinema-hero";
import { FeaturedCourse } from "@/components/featured-course/featured-course";
import { courseOverviewPath } from "@/i18n/lesson-routes";

import { useTranslations } from "next-intl";
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

export default function Home({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("HomePage");
  const tCatalog = useTranslations("CourseCatalog.card");
  const entries = use(loadCatalog());
  const featured = entries[0] ?? null;
  const featuredPoster =
    featured?.firstLesson?.kind === "video" ? (featured.firstLesson.poster ?? null) : null;

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-11 sm:py-20"
    >
      {featured ? (
        <div className="grid flex-1 items-start gap-12 lg:grid-cols-[1fr_auto]">
          <CinemaHero
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
            openLabel={t("openCourse")}
            openHref={courseOverviewPath(featured.course)}
            myListLabel={t("myList")}
          />
          <FeaturedCourse
            course={featured.course}
            href={courseOverviewPath(featured.course)}
            posterUrl={featuredPoster}
            featuredLabel={t("featuredLabel")}
            featureLabel={t("featureLabel")}
            featureHeadline={t("featureHeadline")}
            countsLabel={`${tCatalog("moduleCount", { count: featured.course.moduleCount })} · ${tCatalog("lessonCount", { count: featured.course.lessonCount })}`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <CinemaHero
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
            openLabel={t("openCourse")}
            myListLabel={t("myList")}
          />
          <p
            className="text-sm text-muted-foreground"
            role="status"
          >
            {t("catalogEmpty")}
          </p>
        </div>
      )}
    </main>
  );
}
