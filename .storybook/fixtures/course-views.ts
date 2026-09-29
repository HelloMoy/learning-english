import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import advancedManifest from "../../src/content/advanced-intermediate-course.json";
import basicManifest from "../../src/content/basic-course.json";

type ManifestLesson = {
  id: string;
  sequence: number;
  title: string;
  durationSeconds?: number;
  poster?: string;
};
type ManifestModule = {
  id: string;
  slug: string;
  title: string;
  sequence: number;
  lessons: ManifestLesson[];
};
type Manifest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string;
  sequence: number;
  modules: ManifestModule[];
};

// Posters live under `public/`, which Storybook serves like the app does.
const POSTER_ROOT = "/local-filesystem-lesson/";

/**
 * A catalog course as `findCourseForView` returns it, built from its real
 * manifest so stories show the course's real modules, titles, runtimes and
 * artwork.
 */
function courseViewOf(manifest: Manifest): CourseForView {
  const lessonCount = manifest.modules.reduce((total, module) => total + module.lessons.length, 0);
  const course = Course.parse({
    id: manifest.id,
    slug: manifest.slug,
    title: manifest.title,
    description: manifest.description,
    language: manifest.language,
    lessonCount,
    moduleCount: manifest.modules.length,
    sequence: manifest.sequence,
  });
  const modules = manifest.modules.map((module) =>
    Module.parse({
      id: ModuleId.parse(module.id),
      courseId: course.id,
      slug: module.slug,
      title: module.title,
      sequence: module.sequence,
    }),
  );
  const moduleSummaries = manifest.modules.map((module, index) => {
    const lessons = module.lessons.map((lesson) => ({
      id: LessonId.parse(lesson.id),
      sequence: lesson.sequence,
      title: lesson.title,
      durationSeconds: lesson.durationSeconds ?? 0,
      ...(lesson.poster ? { poster: `${POSTER_ROOT}${lesson.poster}` } : {}),
    }));
    return {
      moduleId: modules[index]!.id,
      lessonCount: lessons.length,
      totalDurationSeconds: lessons.reduce((total, lesson) => total + lesson.durationSeconds, 0),
      lessons,
    };
  });
  return { course, modules, moduleSummaries, firstLesson: null };
}

/** The Basic Course, from its manifest. */
export const BASIC_COURSE_VIEW = courseViewOf(basicManifest as Manifest);

/** The Advanced Intermediate Course, from its manifest. */
export const ADVANCED_COURSE_VIEW = courseViewOf(advancedManifest as Manifest);

/** The catalog, in sequence order. */
export const CATALOG_VIEWS: ReadonlyArray<CourseForView> = [
  BASIC_COURSE_VIEW,
  ADVANCED_COURSE_VIEW,
];

/** The `lessonIndex`-th video of the `moduleIndex`-th module of a course view. */
export function videoOf(view: CourseForView, moduleIndex: number, lessonIndex: number) {
  return view.moduleSummaries[moduleIndex]!.lessons[lessonIndex]!;
}
