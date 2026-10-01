"use client";

import {
  COURSE_ACTION_CLASSES,
  CourseStartLink,
} from "@/components/course-start-link/course-start-link";
import { EnrollmentWelcomeModal } from "@/components/modals/enrollment-welcome-modal/enrollment-welcome-modal";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import {
  enrollInCourse,
  useEnrolledCourses,
} from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { fireCinemaConfetti } from "@/lib/cinema-confetti/cinema-confetti";
import { cn } from "@/lib/utils/utils";

import NiceModal from "@ebay/nice-modal-react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

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
 * course** before the server answers, and back if it refuses. It also
 * welcomes the learner (capability `enrollment-welcome`): the confetti burst
 * and {@link EnrollmentWelcomeModal}, which needs `NiceModal.Provider` above
 * this component, as `global-providers.tsx` mounts it.
 *
 * Once joined, the action is {@link CourseStartLink}: the video the progress
 * board's continue tile would open, worded the same way. A course without
 * videos offers nothing to open, so the action renders nothing once joined.
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
  // Enrolling swaps the button for the link, so "the action" is whichever
  // of the two is mounted when the welcome hands focus back.
  const action = useRef<HTMLElement | null>(null);
  const holdAction = (element: HTMLElement | null) => {
    action.current = element;
  };

  const enrollAndWelcome = () => {
    enrollInCourse(view.course.slug);
    void fireCinemaConfetti();
    void NiceModal.show(EnrollmentWelcomeModal, {
      view,
      focusOnClose: () => action.current?.focus(),
    });
  };

  if (isEnrolled)
    return (
      <CourseStartLink
        ref={holdAction}
        view={view}
        className={className}
      />
    );
  return (
    <button
      ref={holdAction}
      type="button"
      onClick={enrollAndWelcome}
      className={cn(COURSE_ACTION_CLASSES, className)}
    >
      <Plus
        aria-hidden="true"
        className="size-4 shrink-0"
      />
      {t("enroll")}
    </button>
  );
}
