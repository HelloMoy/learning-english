import { CourseProgressBoard } from "@/components/course-progress-board/course-progress-board";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

/**
 * The course overview: the video to continue with and the course's progress,
 * then every lesson as a progress-ring tile.
 *
 * @remarks
 * The page stays a Server Component; everything that depends on the learner's
 * progress lives in {@link CourseProgressBoard}, the one client island, which
 * renders its pending shape on the server — the course title included, so the
 * page's level-one heading is always present.
 *
 * No part of this page lists a lesson's videos: each lesson tile opens the
 * module overview, which does.
 */
export function CourseOverview({
  course,
  modules,
  moduleSummaries,
}: {
  course: Course;
  modules: ReadonlyArray<Module>;
  moduleSummaries: ReadonlyArray<ModuleSummary>;
}) {
  return (
    <article
      data-testid="course-overview"
      className="flex flex-col pt-4 pb-16 sm:pb-24 lg:pt-5"
    >
      <CourseProgressBoard
        course={course}
        modules={modules}
        moduleSummaries={moduleSummaries}
      />
    </article>
  );
}
