/**
 * Key-safety rules shared by every `BlobStore` driver.
 *
 * @remarks
 * These live outside any one driver because the guarantee has to hold for all
 * of them: a key that the local driver refuses must not become readable just
 * because its asset moved to a bucket. One implementation, applied everywhere,
 * is the only way that stays true as drivers are added.
 */

/**
 * The only file extensions `readText` may interpret as UTF-8 text. The current
 * corpus is Markdown only. Binary resources must NOT be decoded as text.
 */
const TEXT_EXTENSIONS = new Set([".md"]);

/**
 * Maximum size in bytes that `readText` will decode. Markdown notes in the
 * current corpus are well under 16 KiB; 1 MiB is a generous safety cap that
 * still prevents accidental binary reads from being materialised as
 * potentially-huge strings in memory.
 */
export const MAX_TEXT_BYTES = 1024 * 1024;

/** Why a content key was refused. */
export type InvalidBlobKeyReason = "traversal" | "absolute" | "binary" | "too-large" | "not-found";

export class InvalidBlobKeyError extends Error {
  readonly key: string;
  readonly reason: InvalidBlobKeyReason;
  constructor(key: string, reason: InvalidBlobKeyReason) {
    super(`Invalid blob key ${JSON.stringify(key)}: ${reason}`);
    this.name = "InvalidBlobKeyError";
    this.key = key;
    this.reason = reason;
  }
}

/**
 * Rejects keys that could escape their store: empty, absolute, or containing a
 * `..` segment.
 *
 * @param key - The content key or object path to check
 * @throws {@link InvalidBlobKeyError} when the key is unsafe
 */
export function assertSafeKey(key: string): void {
  if (!key || key.length === 0) {
    throw new InvalidBlobKeyError(key, "absolute");
  }
  // Reject absolute paths and protocol-relative URLs before any store access.
  if (key.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(key) || key.startsWith("\\")) {
    throw new InvalidBlobKeyError(key, "absolute");
  }
  // Reject path traversal after normalising separators.
  const segments = key.split(/[\\/]+/);
  if (segments.some((segment) => segment === ".." || segment === "")) {
    throw new InvalidBlobKeyError(key, "traversal");
  }
}

/**
 * Rejects keys whose extension is not one `readText` may decode.
 *
 * @param key - The content key or object path to check
 * @throws {@link InvalidBlobKeyError} when the key names a binary asset
 */
export function assertTextKey(key: string): void {
  const lower = key.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  if (!TEXT_EXTENSIONS.has(ext)) {
    throw new InvalidBlobKeyError(key, "binary");
  }
}
