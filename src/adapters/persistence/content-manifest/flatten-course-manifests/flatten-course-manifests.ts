import type {
  CourseManifest,
  ManifestLesson,
  ManifestModule,
} from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";
import type {
  LessonRow,
  ReadingLessonRow,
  ResourceRow,
  VideoLessonRow,
} from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";

/**
 * The catalog in the shape the repositories already consume.
 *
 * @remarks
 * The manifests nest so a person can read them; the in-memory and
 * local-filesystem adapters want flat arrays joined by id. This is the one
 * place that converts between the two, which is why neither the repositories
 * nor the manifest format had to bend to accommodate the other.
 *
 * @category Content manifest
 */
export type FlattenedCatalog = {
  courses: ReadonlyArray<Course>;
  modules: ReadonlyArray<Module>;
  lessonRows: ReadonlyArray<LessonRow>;
  resourceRows: ReadonlyArray<ResourceRow>;
  /** Lesson id → Markdown notes key, for `LocalFilesystemLessonNotesRepository`. */
  notesKeys: Record<string, string>;
};

function countLessons(course: CourseManifest): number {
  return course.modules.reduce((total, courseModule) => total + courseModule.lessons.length, 0);
}

function toCourse(course: CourseManifest): Course {
  return Course.parse({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    language: course.language,
    lessonCount: countLessons(course),
    moduleCount: course.modules.length,
    sequence: course.sequence,
  });
}

function toModule(courseModule: ManifestModule, courseId: string): Module {
  return Module.parse({
    id: courseModule.id,
    courseId,
    slug: courseModule.slug,
    title: courseModule.title,
    sequence: courseModule.sequence,
  });
}

/** The ids a lesson inherits from the module and course containing it. */
type LessonParents = { courseId: string; moduleId: string };

function commonLessonFields(lesson: ManifestLesson, parents: LessonParents) {
  return {
    id: lesson.id,
    courseId: parents.courseId,
    moduleId: parents.moduleId,
    sequence: lesson.sequence,
    title: lesson.title,
  };
}

function toReadingRow(
  lesson: Extract<ManifestLesson, { kind: "reading" }>,
  parents: LessonParents,
): ReadingLessonRow {
  return { ...commonLessonFields(lesson, parents), kind: "reading", body: lesson.body };
}

function toVideoRow(
  lesson: Extract<ManifestLesson, { kind: "video" }>,
  parents: LessonParents,
): VideoLessonRow {
  return {
    ...commonLessonFields(lesson, parents),
    kind: "video",
    description: lesson.description,
    source: lesson.source,
    durationSeconds: lesson.durationSeconds,
    // An absent poster stays absent: spreading `undefined` would put the key
    // in the row, and `resolveLessonRow` would resolve it to `<base>/undefined`.
    ...(lesson.poster === undefined ? {} : { poster: lesson.poster }),
    // Same reasoning for the upload date: its absence is meaningful, because a
    // Lecture without one is deliberately not described as a `VideoObject`.
    ...(lesson.uploadDate === undefined ? {} : { uploadDate: lesson.uploadDate }),
  };
}

/**
 * A lesson row, with the parent ids the nesting implies filled in.
 *
 * @remarks
 * `slug` and `resources` are dropped: the first is there to help a human find
 * the folder, the second becomes its own rows. Everything else maps across
 * unchanged, which is what keeps `resolveLessonRow` untouched by this change.
 */
function toLessonRow(lesson: ManifestLesson, parents: LessonParents): LessonRow {
  return lesson.kind === "reading" ? toReadingRow(lesson, parents) : toVideoRow(lesson, parents);
}

function toResourceRows(lesson: ManifestLesson): ResourceRow[] {
  return lesson.resources.map((resource) => ({
    id: resource.id,
    lessonId: lesson.id,
    title: resource.title,
    url: resource.url,
    kind: resource.kind,
  }));
}

/**
 * Turns the nested course manifests into the flat catalog the repositories take.
 *
 * @remarks
 * Declaration order is preserved throughout: the manifests are ordered by the
 * ladder, and within a course by module and lesson `sequence` as written. The
 * repositories sort where they need to, but a stable input makes a diff of the
 * catalog readable.
 *
 * @param manifests - Parsed course manifests, in ladder order
 * @returns Courses, modules, lesson rows, resource rows and the notes-key map
 * @category Content manifest
 */
export function flattenCourseManifests(manifests: ReadonlyArray<CourseManifest>): FlattenedCatalog {
  const modules: Module[] = [];
  const lessonRows: LessonRow[] = [];
  const resourceRows: ResourceRow[] = [];
  const notesKeys: Record<string, string> = {};

  for (const course of manifests) {
    for (const courseModule of course.modules) {
      modules.push(toModule(courseModule, course.id));
      for (const lesson of courseModule.lessons) {
        lessonRows.push(toLessonRow(lesson, { courseId: course.id, moduleId: courseModule.id }));
        resourceRows.push(...toResourceRows(lesson));
        if (lesson.kind === "video" && lesson.notesKey !== undefined) {
          notesKeys[lesson.id] = lesson.notesKey;
        }
      }
    }
  }

  return { courses: manifests.map(toCourse), modules, lessonRows, resourceRows, notesKeys };
}
