import type { Course } from "@/domain/entities/course/course";
import type { CourseId } from "@/domain/entities/ids/ids";
import type { Slug } from "@/domain/entities/slug/slug";
import type { CourseRepository } from "@/domain/ports/course-repository/course-repository";

/**
 * Driven adapter: in-memory implementation of `CourseRepository`.
 *
 * Production seed data is supplied at construction time and is treated as
 * immutable from the perspective of this adapter. A real database adapter
 * (Postgres, JSON file, ...) implements the same port and lands in a
 * separate change.
 */
export class InMemoryCourseRepository implements CourseRepository {
  readonly #courses: ReadonlyArray<Course>;

  constructor(courses: ReadonlyArray<Course>) {
    this.#courses = courses;
  }

  byId(id: CourseId): Promise<Course | null> {
    return Promise.resolve(this.#courses.find((c) => c.id === id) ?? null);
  }

  bySlug(slug: Slug): Promise<Course | null> {
    return Promise.resolve(this.#courses.find((c) => c.slug === slug) ?? null);
  }

  listAvailable(): Promise<Course[]> {
    return Promise.resolve(this.#courses.slice());
  }
}
