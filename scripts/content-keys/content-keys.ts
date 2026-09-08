import {
  seedContentLessonRows,
  seedContentNotesKeys,
  seedContentResourceRows,
} from "../../src/adapters/persistence/in-memory/seed/seed-content.ts";
import { isAbsoluteHttpUrl } from "../../src/domain/entities/url-or-path/url-or-path.ts";

/**
 * Every content key the generated seed refers to, sorted and de-duplicated.
 *
 * @remarks
 * The seed is the authoritative inventory of what the app will ask for, which
 * is exactly the set a placement change has to keep resolvable. Both
 * `move-content.ts` and `verify:content` walk it, so neither can check a
 * different set from the other.
 *
 * A lesson whose `source` is already a URL is served by someone else — the
 * Basic Course's lectures live on YouTube — so it names no object this store
 * holds and is left out. Including it would make `verify:content` demand a
 * file that was never meant to exist, and invite `move-content.ts` to try to
 * relocate it. Its poster and resources are still keys and are still walked.
 *
 * @returns Video sources, posters, resource URLs and notes keys, sorted
 */
export function allContentKeys(): string[] {
  const keys = new Set<string>();

  for (const lesson of seedContentLessonRows) {
    if (lesson.kind !== "video") continue;
    if (!isAbsoluteHttpUrl(lesson.source)) keys.add(lesson.source);
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
