import type { Course } from "@/domain/entities/course/course";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseEnrollmentRepository } from "@/domain/ports/course-enrollment-repository/course-enrollment-repository";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { EnrollInCourseErrors } from "./enroll-in-course.errors";

const toInternalError = (cause: unknown): EnrollInCourseErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: enroll the learner in a course the catalog serves.
 *
 * Resolves the course through `CourseRepository` first, so a slug the catalog
 * does not serve — unknown, or a draft hidden from this environment — is
 * refused instead of enrolling anyone in it. Enrolling twice is harmless: the
 * port's write is idempotent.
 */
export type EnrollInCourse = (input: {
  courseSlug: Slug;
}) => ResultAsync<{ enrolled: true }, EnrollInCourseErrors>;

export const makeEnrollInCourse = (deps: {
  courses: CourseRepository;
  enrollments: CourseEnrollmentRepository;
}): EnrollInCourse => {
  const servedCourse = (course: Course | null): Result<Course, EnrollInCourseErrors> =>
    course === null ? err({ kind: "course-not-found" }) : ok(course);

  return (input) =>
    ResultAsync.fromPromise(deps.courses.bySlug(input.courseSlug), toInternalError)
      .andThen(servedCourse)
      .andThen((course) =>
        ResultAsync.fromPromise(deps.enrollments.enroll(course.slug), toInternalError).map(() => ({
          enrolled: true as const,
        })),
      );
};
