"use client";

import { CourseStartLink } from "@/components/course-start-link/course-start-link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCourseContinueTarget } from "@/hooks/use-course-continue-target/use-course-continue-target";
import { useEnrolledCourses } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import type { TargetVideo } from "@/lib/course-shelf/course-shelf";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";
import { cn } from "@/lib/utils/utils";

import NiceModal, { useModal, type NiceModalHandler } from "@ebay/nice-modal-react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, type ReactNode } from "react";

/** What the welcome celebrates, and where focus goes once it has closed. */
export type EnrollmentWelcomeModalProps = {
  /** The course the learner just enrolled in. */
  view: CourseForView;
  /**
   * Moves focus once the dialog has closed. The **Enroll** button that opened
   * the dialog is gone by then — the page replaced it with the start link — so
   * the opener says where focus belongs instead of the dialog guessing.
   */
  focusOnClose?: () => void;
};

/**
 * Welcomes a learner who just enrolled from the course page: the poster of
 * the video the course starts with, an **Enrolled** mark, and the way in
 * (capability `enrollment-welcome`).
 *
 * @remarks
 * Shown imperatively with `NiceModal.show(EnrollmentWelcomeModal, props)` by
 * the course page's enroll action, at once, before the server answers. Its
 * primary action is {@link CourseStartLink}, the same link the page shows once
 * joined, so the two cannot disagree; **Keep exploring** closes the dialog and
 * leaves the learner on the course page. A course without videos shows no
 * poster, names no video and offers only **Keep exploring**.
 *
 * The enrollment is optimistic. When the server refuses it and the store
 * withdraws the course, the dialog closes on its own rather than congratulate
 * a learner who is not enrolled.
 *
 * The poster is decoration and hidden from assistive technology. The promise
 * settles with `undefined` on every way out.
 *
 * @example
 * ```ts
 * void NiceModal.show(EnrollmentWelcomeModal, { view, focusOnClose: () => action.focus() });
 * ```
 *
 * @category Components
 */
export const EnrollmentWelcomeModal = NiceModal.create(function EnrollmentWelcomeModal({
  view,
  focusOnClose,
}: EnrollmentWelcomeModalProps) {
  const modal = useModal();
  const t = useTranslations("Components.EnrollmentWelcomeModal");
  const target = useCourseContinueTarget(view);
  const isEnrolled = useEnrolledCourses().has(view.course.slug);
  const poster = target?.lesson.poster;

  const close = () => settleAndHide(modal);
  const moveFocusToOpener = (event: Event) => {
    if (!focusOnClose) return;
    event.preventDefault();
    focusOnClose();
  };

  // The server refused: the store took the course back, so there is nothing to welcome.
  useEffect(() => {
    if (!isEnrolled && modal.visible) settleAndHide(modal);
  }, [isEnrolled, modal]);

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 border-primary/45 p-0 text-center sm:max-w-[30rem]"
        onCloseAutoFocus={moveFocusToOpener}
        onAnimationEnd={() => {
          if (!modal.visible) modal.remove();
        }}
      >
        {poster ? <WelcomePoster poster={poster} /> : null}
        <div
          className={cn(
            "flex flex-col gap-5.5 px-6 pb-7 sm:px-8",
            // Laps a pixel over the poster: its height is fractional, and the
            // artwork's last row would otherwise show as a hairline at the seam.
            poster ? "relative -mt-px bg-card pt-1.25" : "pt-12",
          )}
        >
          <DialogHeader className="items-center gap-3 text-center sm:text-center">
            <EnrolledMark />
            <DialogTitle className="text-[1.75rem] leading-tight font-extrabold tracking-tight sm:text-[2rem]">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-base text-pretty">
              <WelcomeDescription
                courseTitle={view.course.title}
                target={target}
              />
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <CourseStartLink
              view={view}
              className="w-full"
              onClick={close}
            />
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {t("keepExploring")}
            </button>
          </div>
        </div>
        <DialogClose className="absolute top-2 right-2 grid size-11 cursor-pointer place-items-center rounded-full bg-background/60 text-foreground backdrop-blur-sm transition-colors hover:bg-background/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <X
            aria-hidden="true"
            className="size-4"
          />
          <span className="sr-only">{t("close")}</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
});

/** Settles the opener's promise before the closing animation starts, so none is left hanging. */
function settleAndHide(modal: NiceModalHandler): void {
  modal.resolve();
  void modal.hide();
}

/** The starting video's artwork, fading into the card below it. */
function WelcomePoster({ poster }: { poster: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative block aspect-video overflow-hidden"
    >
      <Image
        src={poster}
        alt=""
        fill
        sizes="(min-width: 640px) 480px, 100vw"
        className="object-cover"
      />
      <span className="absolute inset-0 bg-linear-to-t from-card from-4% via-card/55 via-26% to-transparent to-58%" />
    </span>
  );
}

/** The hero's **Enrolled** pill, popping in a beat after the dialog. */
function EnrolledMark() {
  const t = useTranslations("Components.EnrollmentWelcomeModal");
  return (
    <span className="inline-flex animate-in items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground delay-200 duration-500 fade-in-0 fill-mode-both zoom-in-50">
      <Check
        aria-hidden="true"
        className="size-3"
      />
      {t("mark")}
    </span>
  );
}

type WelcomeDescriptionProps = {
  courseTitle: string;
  /** The video the start link opens, or `null` for a course with no videos. */
  target: TargetVideo | null;
};

function WelcomeDescription({ courseTitle, target }: WelcomeDescriptionProps) {
  const t = useTranslations("Components.EnrollmentWelcomeModal");
  const b = (chunks: ReactNode) => <strong className="font-bold text-foreground">{chunks}</strong>;

  if (!target) return t.rich("descriptionWithoutVideo", { course: courseTitle, b });
  return t.rich("description", {
    course: courseTitle,
    video: target.lesson.title,
    duration: formatMinutesSeconds(target.lesson.durationSeconds),
    b,
  });
}
