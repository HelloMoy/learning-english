import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { CourseCard } from "@/components/course-catalog/course-card";

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
  const tCatalog = useTranslations("CourseCatalog.courseOverview");
  const entries = use(loadCatalog());

  return (
    <div className="flex flex-1 flex-col bg-studio-paper font-sans text-ink dark:bg-black">
      <main
        id="main"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-12 sm:px-8 sm:py-16"
      >
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl leading-10 font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t("subtitle")}</p>
        </header>
        <section
          aria-labelledby="catalog-heading"
          className="flex flex-col gap-4"
        >
          <h2
            id="catalog-heading"
            className="text-xl font-semibold tracking-tight"
          >
            {t("catalogHeading")}
          </h2>
          {entries.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              role="status"
            >
              {t("catalogEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-6">
              {entries.map((entry) => (
                <li key={entry.course.id}>
                  <CourseCard
                    course={entry.course}
                    firstLesson={entry.firstLesson}
                    trackLabel={tCatalog("trackLabel")}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
