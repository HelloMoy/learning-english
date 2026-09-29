import type { Slug } from "@/domain/entities/slug/slug";

/**
 * Port: the courses a learner has enrolled in.
 *
 * Enrollment only adds — there is no leaving a course (capability
 * `course-enrollment`) — so, like prize claims, the port offers a read and an
 * idempotent write.
 */
export interface CourseEnrollmentRepository {
  /** The slug of every course the learner is enrolled in. */
  list(): Promise<ReadonlySet<Slug>>;

  /** Enrolls the learner in one course; idempotent. */
  enroll(courseSlug: Slug): Promise<void>;
}
