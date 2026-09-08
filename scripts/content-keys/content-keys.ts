import {
  seedContentLessonRows,
  seedContentNotesKeys,
  seedContentResourceRows,
} from "../../src/adapters/persistence/in-memory/seed/seed-content.ts";

/**
 * Every content key the generated seed refers to, sorted and de-duplicated.
 *
 * @remarks
 * The seed is the authoritative inventory of what the app will ask for, which
 * is exactly the set a placement change has to keep resolvable. Both
 * `move-content.ts` and `verify:content` walk it, so neither can check a
 * different set from the other.
 *
 * @returns Video sources, posters, resource URLs and notes keys, sorted
 */
export function allContentKeys(): string[] {
  const keys = new Set<string>();

  for (const lesson of seedContentLessonRows) {
    if (lesson.kind !== "video") continue;
    keys.add(lesson.source);
    if (lesson.poster) keys.add(lesson.poster);
  }
  for (const resource of seedContentResourceRows) {
    keys.add(resource.url);
  }
  for (const notesKey of Object.values(seedContentNotesKeys)) {
    keys.add(notesKey);
  }

  return [...keys].sort();
}
