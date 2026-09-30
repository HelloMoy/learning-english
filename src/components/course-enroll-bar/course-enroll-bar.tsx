"use client";

import { CourseEnrollAction } from "@/components/course-enroll-action/course-enroll-action";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseFacts } from "@/lib/course-shelf/course-shelf";

import { useTranslations } from "next-intl";

/** Props for {@link CourseEnrollBar}. */
export type CourseEnrollBarProps = {
  /** The course to enroll in. */
  view: CourseForView;
};

/**
 * The course page's bottom bar on narrow screens: the course's name and size,
 * and the enroll action, kept at the bottom of the viewport while the page
 * scrolls.
 *
 * @remarks
 * On a phone the enroll card sits below the syllabus, so without this bar the
 * action would be a long scroll away. From `lg` the card stays beside the
 * sections and the bar is hidden. It sticks to its container's bottom edge,
 * so render it as the page's last child.
 *
 * @example
 * ```tsx
 * <CourseEnrollBar view={courseView} />
 * ```
 */
export function CourseEnrollBar({ view }: CourseEnrollBarProps) {
  const t = useTranslations("Components.CourseEnrollBar");
  const runtimeLabel = useRuntimeLabel();
  const facts = courseFacts(view);

  return (
    <aside
      aria-label={t("label")}
      className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:-mx-11 sm:px-11 lg:hidden"
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[0.9375rem] font-black text-foreground">
          {view.course.title}
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t("facts", { videos: facts.videoCount, runtime: runtimeLabel(facts.runtimeSeconds) })}
        </span>
      </span>
      <CourseEnrollAction view={view} />
    </aside>
  );
}
