import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";

/**
 * Centralised URL builders for the catalog and lesson pages. Pages and
 * components import these instead of concatenating URL strings, so
 * future routing changes happen in one place.
 */
export function courseOverviewPath(course: Pick<Course, "slug">): string {
  return `/courses/${course.slug}`;
}

export function moduleOverviewPath(
  course: Pick<Course, "slug">,
  module: Pick<Module, "slug">,
): string {
  return `/courses/${course.slug}/modules/${module.slug}`;
}

export function lessonPath(
  course: Pick<Course, "slug">,
  module: Pick<Module, "slug">,
  lesson: Pick<Lesson, "id">,
): string {
  return `/courses/${course.slug}/modules/${module.slug}/lessons/${lesson.id}`;
}
