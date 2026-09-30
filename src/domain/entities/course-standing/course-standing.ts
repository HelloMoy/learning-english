import type { Course } from "@/domain/entities/course/course";
import type { CourseId } from "@/domain/entities/ids/ids";

/**
 * Where a course stands in the catalog: a numbered level, or reference material.
 *
 * @remarks
 * The level number is derived from the level courses' order, never declared and
 * never read off `Course.sequence`, so a reference course placed between two
 * levels does not open a gap in the numbering.
 */
export type CourseStanding = LevelStanding | { kind: "reference" };

/** The standing of a rung of the ladder: its derived, 1-based level number. */
export type LevelStanding = { kind: "level"; number: number };

/** The level number of "the first course" — the one a new learner starts with. */
export const FIRST_LEVEL = 1;

/**
 * Derives every course's standing from the catalog it belongs to.
 *
 * @example
 * ```ts
 * courseStandings([basic, atlas, advanced]);
 * // basic → level 1, atlas → reference, advanced → level 2
 * ```
 *
 * @param courses - The whole catalog, in any order
 * @returns Each course's standing, keyed by course id, in `sequence` order
 */
export function courseStandings(
  courses: ReadonlyArray<Course>,
): ReadonlyMap<CourseId, CourseStanding> {
  const levels = levelsBySequence(courses);
  const bySequence = [...courses].sort((a, b) => a.sequence - b.sequence);

  return new Map(bySequence.map((course) => [course.id, standingWithin(levels, course)]));
}

/**
 * One course's standing within its catalog.
 *
 * @remarks
 * The course is placed among the catalog by its `sequence` even when the
 * catalog omits it, so a caller holding a single course never has to guess
 * whether it is a level.
 *
 * @param catalog - The catalog the course belongs to
 * @param course - The course to stand
 * @returns Its derived standing
 */
export function standingInCatalog(catalog: ReadonlyArray<Course>, course: Course): CourseStanding {
  const others = catalog.filter((candidate) => candidate.id !== course.id);
  return standingWithin(levelsBySequence([...others, course]), course);
}

function levelsBySequence(courses: ReadonlyArray<Course>): Course[] {
  return [...courses]
    .sort((a, b) => a.sequence - b.sequence)
    .filter((course) => course.track === "level");
}

function standingWithin(levels: ReadonlyArray<Course>, course: Course): CourseStanding {
  return course.track === "reference"
    ? { kind: "reference" }
    : { kind: "level", number: levels.indexOf(course) + 1 };
}

/**
 * Finds "the first course": the item standing at level 1.
 *
 * @remarks
 * Every surface that names or starts the first course goes through here, so a
 * reference course can never take that place, whatever its `sequence`.
 *
 * @param items - Anything carrying a {@link CourseStanding}
 * @returns The level-1 item, or `undefined` when the catalog holds no level
 */
export function findFirstLevel<Item extends { standing: CourseStanding }>(
  items: ReadonlyArray<Item>,
): (Item & { standing: LevelStanding }) | undefined {
  return items.find(
    (item): item is Item & { standing: LevelStanding } =>
      item.standing.kind === "level" && item.standing.number === FIRST_LEVEL,
  );
}
