import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { ResultAsync } from "@/domain/result/result";
import type { EnrollInCourse } from "@/domain/use-cases/enroll-in-course/enroll-in-course";

import type { RecordContinueWatchingErrors } from "./record-continue-watching.errors";

const toInternalError = (cause: unknown): RecordContinueWatchingErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: record where the learner is, enrolling them in that course.
 *
 * Opening a lesson is how a learner joins its course (capability
 * `course-enrollment`), so the enrollment runs first and the location is only
 * stored once it succeeded — a course the catalog does not serve gets neither.
 */
export type RecordContinueWatching = (
  location: ContinueWatchingLocation,
) => ResultAsync<{ recorded: true }, RecordContinueWatchingErrors>;

export const makeRecordContinueWatching = (deps: {
  enrollInCourse: EnrollInCourse;
  continueWatching: ContinueWatchingRepository;
}): RecordContinueWatching => {
  return (location) =>
    deps.enrollInCourse({ courseSlug: location.courseSlug }).andThen(() =>
      ResultAsync.fromPromise(deps.continueWatching.set(location), toInternalError).map(() => ({
        recorded: true as const,
      })),
    );
};
