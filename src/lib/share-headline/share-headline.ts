/**
 * The promise a course makes, extracted from its description.
 *
 * @remarks
 * A sharing card's headline is the one line a reader sees before deciding
 * whether to click — and on X it is now the *only* thing they see, since the
 * card renders image-only in the feed. A catalog name spends that line badly:
 * `Basic Course` names a row in a database and tells a reader nothing about
 * what they would learn. `American pronunciation from the ground up` tells them
 * exactly.
 *
 * Course descriptions in this catalog are already written that way — a promise,
 * then a colon, then the specifics. So the headline is the part before the
 * colon, or before the first sentence end when there is no colon.
 *
 * The fallbacks matter more than the happy path: a description with neither
 * punctuation mark, or one that opens with the mark, must still yield a
 * headline. An empty card headline is worse than a long one.
 *
 * @example
 * ```ts
 * shareHeadline("American pronunciation from the ground up: vowel sounds, drills.");
 * // "American pronunciation from the ground up"
 * ```
 *
 * @param description - The course's own description, from the content manifest
 * @returns The leading clause, trimmed; the whole trimmed description if it has no cut point
 * @category Metadata
 */
export function shareHeadline(description: string): string {
  const trimmed = description.trim();

  const beforeColon = cutAt(trimmed, trimmed.indexOf(":"));
  if (beforeColon) return beforeColon;

  // A period only ends a sentence when a space follows it. Without that check,
  // "44.5 hours" would be cut to "44".
  const beforeSentenceEnd = cutAt(trimmed, trimmed.search(/\.\s/));
  if (beforeSentenceEnd) return beforeSentenceEnd;

  return trimmed;
}

/** The text before `index`, trimmed — or nothing, when that would be empty. */
function cutAt(text: string, index: number): string | null {
  if (index <= 0) return null;
  const head = text.slice(0, index).trim();
  return head.length > 0 ? head : null;
}
