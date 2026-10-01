import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import type { CourseCardModel } from "@/lib/course-shelf/course-shelf";

/**
 * One poster of Available courses' lobby: a course the learner is enrolled
 * in, read with their progress, or one they can still join.
 *
 * @category Course lobby
 */
export type LobbyEntry =
  { kind: "enrolled"; model: CourseCardModel } | { kind: "joinable"; view: CourseForView };

/**
 * Orders every catalog course for Available courses' lobby: the learner's
 * courses first, then every course they have not joined, in catalog order.
 *
 * @remarks
 * `enrolled` is taken in the order given — `useCourseShelf` already puts the
 * course watched most recently first — so the lobby and My learning agree on
 * which course leads.
 *
 * @example
 * ```ts
 * const lobby = courseLobby([shelf.featured, ...shelf.otherEnrolled], courses);
 * ```
 *
 * @param enrolled - The learner's courses, the one to lead with first
 * @param courses - Every catalog course's view
 * @returns One entry per catalog course
 *
 * @category Course lobby
 */
export function courseLobby(
  enrolled: ReadonlyArray<CourseCardModel>,
  courses: ReadonlyArray<CourseForView>,
): LobbyEntry[] {
  const enrolledSlugs = new Set(enrolled.map((model) => model.course.slug));
  const joinable = courses
    .filter((view) => !enrolledSlugs.has(view.course.slug))
    .sort((a, b) => a.course.sequence - b.course.sequence);

  return [
    ...enrolled.map((model) => ({ kind: "enrolled", model }) as const),
    ...joinable.map((view) => ({ kind: "joinable", view }) as const),
  ];
}
