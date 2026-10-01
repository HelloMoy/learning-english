"use client";

import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCourseContinueTarget } from "@/hooks/use-course-continue-target/use-course-continue-target";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { TargetVideo } from "@/lib/course-shelf/course-shelf";
import { cn } from "@/lib/utils/utils";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEventHandler, Ref } from "react";

/**
 * How the course page's one action looks, whether it enrolls or opens a video.
 * Shared with `CourseEnrollAction`'s **Enroll** button so the two never drift.
 */
export const COURSE_ACTION_CLASSES =
  "inline-flex min-h-13 cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-primary px-5.5 text-base font-extrabold whitespace-nowrap text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none";

/** The label for each reason to open a video, as the board's continue tile words it. */
const LABEL_KEY: Record<
  TargetVideo["kind"],
  "startCourse" | "continueWhereLeftOff" | "watchAgain"
> = {
  start: "startCourse",
  continue: "continueWhereLeftOff",
  rewatch: "watchAgain",
};

/** Props for {@link CourseStartLink}. */
export type CourseStartLinkProps = {
  /** The course to open a video of. */
  view: CourseForView;
  /** Layout-only classes, such as `w-full` inside a card. */
  className?: string;
  /** Called when the link is activated, before the navigation starts. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Receives the link, for a caller that needs to move focus to it. */
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * The way into a course the learner has joined: **Start course**, **Continue
 * where you left off** or **Watch again**.
 *
 * @remarks
 * Opens the video the progress board's continue tile would open, read with
 * `useCourseContinueTarget`, and words it the same way (capability
 * `continue-target`). The course page's enroll action and the enrollment
 * welcome both render this component, which is what keeps their label and
 * destination equal.
 *
 * It does not check enrollment — the caller decides when a learner has joined.
 * A course without videos offers nothing to open, so it renders nothing.
 *
 * @example
 * ```tsx
 * <CourseStartLink view={courseView} className="w-full" onClick={closeDialog} />
 * ```
 *
 * @category Components
 */
export function CourseStartLink({ view, className, onClick, ref }: CourseStartLinkProps) {
  const t = useTranslations("Components.CourseStartLink");
  const target = useCourseContinueTarget(view);

  if (!target) return null;
  return (
    <Link
      ref={ref}
      href={lessonPath(view.course, target.module, target.lesson) as never}
      onClick={onClick}
      className={cn(COURSE_ACTION_CLASSES, className)}
    >
      <Play
        aria-hidden="true"
        className="size-4 shrink-0"
        fill="currentColor"
      />
      {t(LABEL_KEY[target.kind])}
    </Link>
  );
}
