import { z } from "zod";

/**
 * Longest name a learner card can hold. Long enough for a first and last name
 * in any of the supported languages, short enough to fit the card on a phone.
 */
export const LEARNER_NAME_MAX_LENGTH = 40;

/** The eight illustrations a learner can wear instead of their initials. */
export const LEARNER_ILLUSTRATION_IDS = [
  "sun",
  "wave",
  "leaf",
  "plum",
  "ember",
  "echo",
  "night",
  "schwa",
] as const;

export const LearnerIllustrationId = z.enum(LEARNER_ILLUSTRATION_IDS);

export type LearnerIllustrationId = z.infer<typeof LearnerIllustrationId>;

/**
 * What the learner's avatar shows: the initials derived from their name, or
 * one of the shipped illustrations.
 *
 * An illustration is stored by id, never by asset path, so moving an asset
 * cannot invalidate a stored profile.
 */
export const LearnerAvatar = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("initials") }),
  z.object({ kind: z.literal("illustration"), id: LearnerIllustrationId }),
]);

export type LearnerAvatar = z.infer<typeof LearnerAvatar>;

/**
 * Who is learning on this device: a name and an avatar.
 *
 * The name is trimmed before its length is judged, so a name of spaces is
 * blank rather than valid.
 */
export const LearnerProfile = z.object({
  name: z.string().trim().min(1).max(LEARNER_NAME_MAX_LENGTH),
  avatar: LearnerAvatar,
});

export type LearnerProfile = z.infer<typeof LearnerProfile>;

const nameWords = (name: string): string[] => name.trim().split(/\s+/).filter(Boolean);

const firstCharacter = (word: string): string => Array.from(word)[0] ?? "";

/**
 * The letters an initials avatar shows: the first letter of the first word,
 * followed by the first letter of the last word when there is more than one.
 *
 * @returns Upper-cased initials, or `?` for a blank name
 */
export function learnerInitials(name: string): string {
  const words = nameWords(name);
  if (words.length === 0) return "?";
  const first = firstCharacter(words[0]);
  const last = words.length > 1 ? firstCharacter(words[words.length - 1]) : "";
  return `${first}${last}`.toUpperCase();
}

/** The first word of the learner's name — what a greeting calls them. */
export function learnerFirstName(name: string): string {
  return nameWords(name)[0] ?? "";
}
