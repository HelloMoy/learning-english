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

/**
 * A store whose objects are private and reachable only through a time-limited
 * signed URL.
 *
 * @remarks
 * Deliberately NOT part of {@link BlobStore}. Signing is asynchronous, and
 * `BlobStore.url` is synchronous because it runs while domain entities are
 * being constructed. Only the signing endpoint needs a signed URL, and it can
 * afford to await one; keeping the two interfaces separate is what stops
 * `async` from spreading into every adapter.
 */
export interface SignedUrlSource {
  /**
   * Returns a URL that grants temporary read access to the object.
   *
   * @param objectPath - Path within this store, prefix already applied
   * @param ttlSeconds - How long the URL stays valid
   */
  signedUrl(objectPath: string, ttlSeconds: number): Promise<string>;
}

/** Whether a store can mint signed URLs. */
export function isSignedUrlSource(store: unknown): store is SignedUrlSource {
  return typeof (store as SignedUrlSource | null)?.signedUrl === "function";
}

/**
 * A store whose objects can be copied in and out and removed.
 *
 * @remarks
 * Deliberately NOT part of {@link BlobStore}. The application only ever reads
 * content; writing exists for one caller, `scripts/move-content.ts`, and
 * keeping it off the read interface means no request path can reach it.
 */
export interface TransferableBlobStore {
  /** Reads an object's raw bytes, for copying it to another store. */
  readBytes(objectPath: string): Promise<Uint8Array>;
  /** Writes an object's raw bytes, creating or replacing it. */
  write(objectPath: string, body: Uint8Array): Promise<void>;
  /** Removes an object. Used only after a verified copy. */
  remove(objectPath: string): Promise<void>;
}

/** Whether a store can copy objects in and out. */
export function isTransferable(store: unknown): store is TransferableBlobStore {
  return typeof (store as TransferableBlobStore | null)?.readBytes === "function";
}
