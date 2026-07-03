import type { Course } from "@/domain/entities/course/course";
import type { CourseId } from "@/domain/entities/ids/ids";
import type { Slug } from "@/domain/entities/slug/slug";

/**
 * Port: read-only access to courses.
 *
 * The domain declares what it needs from outside (this interface) but knows
 * nothing about how courses are stored. Driven adapters (in-memory, JSON file,
 * Postgres, ...) implement this contract.
 */
export interface CourseRepository {
  byId(id: CourseId): Promise<Course | null>;
  bySlug(slug: Slug): Promise<Course | null>;
  listAvailable(): Promise<Course[]>;
}
