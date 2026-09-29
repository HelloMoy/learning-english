import type { Database } from "@/adapters/persistence/turso/database/database";
import { courseEnrollment } from "@/adapters/persistence/turso/schema/schema";
import { Slug } from "@/domain/entities/slug/slug";
import type { CourseEnrollmentRepository } from "@/domain/ports/course-enrollment-repository/course-enrollment-repository";

import { eq } from "drizzle-orm";

/**
 * `CourseEnrollmentRepository` over the `course_enrollment` table, for one
 * learner. An enrollment is kept for good, so enrolling again changes nothing.
 */
export class TursoCourseEnrollmentRepository implements CourseEnrollmentRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async list(): Promise<ReadonlySet<Slug>> {
    const rows = await this.database
      .select({ courseSlug: courseEnrollment.courseSlug })
      .from(courseEnrollment)
      .where(eq(courseEnrollment.userId, this.learnerId));
    return new Set(rows.flatMap(({ courseSlug }) => parsedSlug(courseSlug)));
  }

  async enroll(courseSlug: Slug): Promise<void> {
    await this.database
      .insert(courseEnrollment)
      .values({ userId: this.learnerId, courseSlug })
      .onConflictDoNothing();
  }
}

function parsedSlug(value: string): Slug[] {
  const parsed = Slug.safeParse(value);
  return parsed.success ? [parsed.data] : [];
}
