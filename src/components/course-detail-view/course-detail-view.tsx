"use client";

import { CourseDetailHero } from "@/components/course-detail-hero/course-detail-hero";
import { CourseEnrollBar } from "@/components/course-enroll-bar/course-enroll-bar";
import { CourseEnrollCard } from "@/components/course-enroll-card/course-enroll-card";
import { CourseOutcomes } from "@/components/course-outcomes/course-outcomes";
import { CourseSoundStrip } from "@/components/course-sound-strip/course-sound-strip";
import { CourseSyllabus } from "@/components/course-syllabus/course-syllabus";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { courseCopy } from "@/lib/course-copy/course-copy";

import { useLocale } from "next-intl";

/** Props for {@link CourseDetailView}. */
export type CourseDetailViewProps = {
  /** The course the page presents. */
  view: CourseForView;
};

/**
 * The course page a learner sees before joining a course: what it teaches,
 * what is in it, how long it takes, and **Enroll** (capability
 * `course-detail-page`).
 *
 * @remarks
 * The hero opens the page; below it, **What you'll learn**, the sounds the
 * course teaches and the syllabus run down the main column, and the enroll
 * card sits beside them from `lg`, staying in view while they scroll. On
 * narrower screens the card follows the syllabus and {@link CourseEnrollBar}
 * keeps the action at the bottom of the viewport. Sections a course declares
 * nothing for do not render. Outcomes are shown in the active locale through
 * `courseCopy`.
 *
 * @example
 * ```tsx
 * <CourseDetailView view={courseView} />
 * ```
 */
export function CourseDetailView({ view }: CourseDetailViewProps) {
  const { outcomes } = courseCopy(view.course, useLocale());
  const { sounds } = view.course;

  return (
    <div
      data-testid="course-detail-view"
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-4 pb-10 sm:px-11 lg:gap-12 lg:pt-5 lg:pb-24"
    >
      <CourseDetailHero view={view} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-11">
        <div className="flex min-w-0 flex-col gap-10 lg:gap-12">
          <CourseOutcomes outcomes={outcomes} />
          {sounds ? <CourseSoundStrip sounds={sounds} /> : null}
          <CourseSyllabus view={view} />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CourseEnrollCard view={view} />
        </div>
      </div>
      <CourseEnrollBar view={view} />
    </div>
  );
}
