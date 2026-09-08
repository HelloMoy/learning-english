import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { LessonRow } from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";

/**
 * Seed lookups scoped to one course, for specs that target a specific one.
 *
 * @remarks
 * `contentCatalog.modules` and `contentCatalog.lessonRows` hold the union of every
 * declared course's rows — each row carries the `courseId` or `moduleId` that
 * owns it, and no consumer gets a per-course export. A spec that pins a course
 * slug and then reads `contentCatalog.modules[0]`, or counts `.length`, is reading
 * across courses: correct while one course was declared, wrong the moment a
 * second one is. These helpers are what keep the two in step.
 */

/** The declared course with this slug. */
export function courseBySlug(slug: string): Course {
  const course = contentCatalog.courses.find((candidate) => candidate.slug === slug);
  if (!course) throw new Error(`No course declared with slug "${slug}"`);
  return course;
}

/** That course's modules, in the order the UI lists them. */
export function modulesOfCourse(slug: string): Module[] {
  const course = courseBySlug(slug);
  return contentCatalog.modules
    .filter((module) => module.courseId === course.id)
    .sort((a, b) => a.sequence - b.sequence);
}

/** One module's lessons, in the order the UI lists them. */
export function lessonsOfModule(moduleId: string): LessonRow[] {
  return contentCatalog.lessonRows
    .filter((lesson) => lesson.moduleId === moduleId)
    .sort((a, b) => a.sequence - b.sequence);
}

/** That course's module bearing this slug. */
export function moduleOfCourse(courseSlug: string, moduleSlug: string): Module {
  const module_ = modulesOfCourse(courseSlug).find((candidate) => candidate.slug === moduleSlug);
  if (!module_) throw new Error(`Course "${courseSlug}" declares no module "${moduleSlug}"`);
  return module_;
}
