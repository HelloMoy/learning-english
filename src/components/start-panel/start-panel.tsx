import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * My learning's panel for a learner with nothing to resume yet: the first
 * video, ready to watch.
 *
 * @remarks
 * It takes the resume panel's place and shape, so a learner's page looks the
 * same before and after their first video — only the action changes.
 *
 * @param firstLessonHref - Locale-relative path of the first course's first lesson
 * @param firstLessonMinutes - That lesson's runtime in whole minutes, or `null` when it has none
 * @param courseTitle - The course the lesson opens
 */
export function StartPanel({
  firstLessonHref,
  firstLessonMinutes,
  courseTitle,
}: {
  firstLessonHref: string;
  firstLessonMinutes: number | null;
  courseTitle: string;
}) {
  const t = useTranslations("Components.StartPanel");

  return (
    <div className="flex flex-col gap-4 rounded-[1.125rem] border border-border bg-card p-5 sm:p-6">
      <p className="text-xs text-muted-foreground sm:text-sm">
        {firstLessonMinutes === null
          ? t("noteNoDuration", { course: courseTitle })
          : t("note", { course: courseTitle, minutes: firstLessonMinutes })}
      </p>
      <p className="font-sans text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.75rem]">
        {t("heading")}
      </p>
      <div className="flex pt-1">
        <Link
          href={firstLessonHref as never}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 text-[0.9375rem] font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-auto"
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("action")}
        </Link>
      </div>
    </div>
  );
}
