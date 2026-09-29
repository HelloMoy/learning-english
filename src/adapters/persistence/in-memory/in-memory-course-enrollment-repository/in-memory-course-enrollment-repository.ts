import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseEnrollmentRepository } from "@/domain/ports/course-enrollment-repository/course-enrollment-repository";

/**
 * In-memory `CourseEnrollmentRepository`, for use-case tests and stories.
 */
export class InMemoryCourseEnrollmentRepository implements CourseEnrollmentRepository {
  readonly #enrolled: Set<Slug>;

  constructor(initial: Iterable<Slug> = []) {
    this.#enrolled = new Set(initial);
  }

  list(): Promise<ReadonlySet<Slug>> {
    return Promise.resolve(new Set(this.#enrolled));
  }

  enroll(courseSlug: Slug): Promise<void> {
    this.#enrolled.add(courseSlug);
    return Promise.resolve();
  }
}
