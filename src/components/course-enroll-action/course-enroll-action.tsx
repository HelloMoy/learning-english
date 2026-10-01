"use client";

import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCourseContinueTarget } from "@/hooks/use-course-continue-target/use-course-continue-target";
import {
  enrollInCourse,
  useEnrolledCourses,
} from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { TargetVideo } from "@/lib/course-shelf/course-shelf";
import { cn } from "@/lib/utils/utils";

import { Play, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const ACTION_CLASSES =
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

/** Props for {@link CourseEnrollAction}. */
export type CourseEnrollActionProps = {
  /** The course to enroll in or start. */
  view: CourseForView;
  /** Layout-only classes, such as `w-full` inside a card. */
  className?: string;
};

/**
 * The course page's one action: **Enroll** until the learner has joined the
 * course, then the way into it — **Start course**, **Continue where you left
 * off** or **Watch again**.
 *
 * @remarks
 * **Enroll** enrolls through the learner store at once (capability
 * `course-enrollment`), so every instance on the page flips to **Start
 * course** before the server answers, and back if it refuses.
 *
 * Once joined, the action opens the video the progress board's continue tile
 * would open, read with `useCourseContinueTarget`, and words it the same way.
 * A course without videos offers nothing to open, so the action renders
 * nothing once joined.
 *
 * Each instance reads the enrollment and the progress itself, which is what
 * keeps the hero, the enroll card and the phone bar in agreement.
 *
 * @example
 * ```tsx
 * <CourseEnrollAction view={courseView} className="w-full" />
 * ```
 */
export function CourseEnrollAction({ view, className }: CourseEnrollActionProps) {
  const t = useTranslations("Components.CourseEnrollAction");
  const isEnrolled = useEnrolledCourses().has(view.course.slug);
  const target = useCourseContinueTarget(view);

  if (!isEnrolled) {
    return (
      <button
        type="button"
        onClick={() => enrollInCourse(view.course.slug)}
        className={cn(ACTION_CLASSES, className)}
      >
        <Plus
          aria-hidden="true"
          className="size-4 shrink-0"
        />
        {t("enroll")}
      </button>
    );
  }
  if (!target) return null;
  return (
    <Link
      href={lessonPath(view.course, target.module, target.lesson) as never}
      className={cn(ACTION_CLASSES, className)}
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
