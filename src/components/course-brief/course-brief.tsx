import type { Course } from "@/domain/entities/course/course";
import { courseCopy } from "@/lib/course-copy/course-copy";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/** Props for {@link CourseBrief}. */
export type CourseBriefProps = {
  /** The course, with its audience, highlights and their translations. */
  course: Pick<Course, "description" | "outcomes" | "audience" | "highlights" | "translations">;
};

const LABEL =
  "mr-2 inline text-[0.625rem] font-bold tracking-[0.2em] whitespace-nowrap text-gold uppercase";

/**
 * A course at a glance: **For** — who it suits — and **You'll learn** — its
 * highlights — in the active locale.
 *
 * @remarks
 * The copy is course content, read through `courseCopy`, so a missing
 * translation falls back to the manifest's own; only the two labels come from
 * the messages. Each line renders only when the course declares it, and a
 * course that declares neither renders nothing. The full outcomes stay on the
 * course page.
 *
 * @example
 * ```tsx
 * <CourseBrief course={view.course} />
 * ```
 */
export function CourseBrief({ course }: CourseBriefProps) {
  const t = useTranslations("Components.CourseBrief");
  const { audience, highlights } = courseCopy(course, useLocale());
  if (!audience && highlights.length === 0) return null;

  return (
    <dl
      data-testid="course-brief"
      className="flex min-w-0 flex-col gap-1 text-[0.8125rem] leading-snug"
    >
      {audience ? (
        <div>
          <dt className={LABEL}>{t("audience")}</dt>
          <dd className="inline text-muted-foreground">{audience}</dd>
        </div>
      ) : null}
      {highlights.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          <dt className={LABEL}>{t("highlights")}</dt>
          <dd>
            <ul className="flex flex-col gap-0.5 text-foreground">
              {highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-1.5"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-[0.2rem] size-3 shrink-0 text-gold"
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
