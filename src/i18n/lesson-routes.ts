import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

/** Anything that names a course by its slug, branded or not. */
type CourseRef = { slug: string };

/**
 * Centralised URL builders for the catalog and lesson pages. Pages and
 * components import these instead of concatenating URL strings, so
 * future routing changes happen in one place.
 *
 * @remarks
 * `/courses/<slug>` itself has no page: every course route names what it
 * shows (`/progress`, `/about`, `/modules/...`).
 */
export function courseOverviewPath(course: CourseRef): string {
  return `${courseRootOf(course)}/progress`;
}

/**
 * The course page's own address: it shows the course page to every learner,
 * enrolled or not, where {@link courseOverviewPath} gives an enrolled learner
 * the progress board.
 */
export function courseDetailPath(course: CourseRef): string {
  return `${courseRootOf(course)}/about`;
}

export function moduleOverviewPath(course: CourseRef, module: Pick<Module, "slug">): string {
  return `${courseRootOf(course)}/modules/${module.slug}`;
}

export function lessonPath(
  course: CourseRef,
  module: Pick<Module, "slug">,
  lesson: Pick<Lesson, "id">,
): string {
  return `${moduleOverviewPath(course, module)}/lessons/${lesson.id}`;
}

function courseRootOf(course: CourseRef): string {
  return `/courses/${course.slug}`;
}
