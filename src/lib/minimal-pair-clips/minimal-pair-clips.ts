/**
 * The recorded clips the home's vowel-length card plays, keyed by the English
 * word each one speaks.
 *
 * @remarks
 * The clips are UI assets served straight from `public/`, like icons — not
 * course content, so they do not resolve through a `BlobStore`. Replacing a
 * synthesized clip with a real recording is a file swap under the same path.
 *
 * @category Utilities
 */
export const MINIMAL_PAIR_CLIPS = {
  ship: "/audio/minimal-pairs/ship.mp3",
  sheep: "/audio/minimal-pairs/sheep.mp3",
} as const;

/** A word the vowel-length card can play. */
export type MinimalPairWord = keyof typeof MINIMAL_PAIR_CLIPS;
