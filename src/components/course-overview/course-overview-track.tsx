import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import { moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

/**
 * Interactive practice-track navigation for the course overview. Each
 * numbered mark links to a module overview route. The visual encoding
 * matches the non-interactive summary on the home card.
 */
export function CourseOverviewTrack({
  course,
  modules,
}: {
  course: Course;
  modules: ReadonlyArray<Module>;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  if (modules.length === 0) return null;
  return (
    <nav
      aria-label={t("trackLabel")}
      data-testid="course-track"
    >
      <span className="sr-only">{t("trackLabel")}</span>
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {modules.map((module) => (
          <li
            key={module.id}
            className="flex flex-1 items-center gap-3"
          >
            <Link
              href={moduleOverviewPath(course, module) as never}
              className="flex min-h-11 flex-1 items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-practice-blue/60 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-yellow text-sm font-semibold text-ink tabular-nums">
                {String(module.sequence).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium">{module.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
