import type { EnrollInCourseErrors } from "@/domain/use-cases/enroll-in-course/enroll-in-course.errors";

/**
 * Discriminated union of errors raised by `recordContinueWatching`: those of
 * the enrollment it runs first, plus `internal-error` when the continue-watching
 * repository rejects the location.
 */
export type RecordContinueWatchingErrors = EnrollInCourseErrors;
