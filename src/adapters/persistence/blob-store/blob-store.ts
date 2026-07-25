/**
 * Driven-adapter primitive: resolves opaque content "keys" to URLs (and
 * checks whether a key exists in the underlying store).
 *
 * BlobStore is **not** a domain port. The domain (`src/domain/**`) does not
 * import this file — it sees URLs as plain strings on `VideoLesson.source`
 * and `Resource.url`. The BlobStore exists so that lesson/resource adapters
 * can stay agnostic to whether content is served from a local folder in
 * development or from an S3-compatible bucket in production; only the
 * BlobStore implementation changes.
 *
 * A "key" is an opaque, store-agnostic, URL-safe identifier such as
 * `advanced-intermediate-course/5-sound-natural-intonation/03-falling-intonation.mp4`.
 * Keys MUST be kebab-case ASCII (no spaces, no `&`/`#`/`:`).
 *
 * Future drivers: `S3BlobStore`, `R2BlobStore`. See
 * `openspec/changes/filesystem-backed-course-content/design.md` for the
 * migration plan.
 */
export interface BlobStore {
  /**
   * Returns the public URL for the given content key. For the local driver,
   * this is the path under `/public/` that Next.js serves. For the S3
   * driver, this is the bucket URL (and optionally signed).
   */
  url(key: string): string;

  /**
   * Returns whether a blob for the given key exists in the underlying store.
   * Used by the seed generator to verify content is present, and by future
   * code paths that need to surface "missing media" states.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Reads a bounded UTF-8 text blob for a known text key. Implementations
   * MUST validate that the key is safe (no absolute prefixes, no `..` path
   * segments) and reject keys that point to binary asset types before
   * returning any text. Missing or non-text keys reject; the read is not
   * a general arbitrary-path API.
   */
  readText(key: string): Promise<string>;
}
