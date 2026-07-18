import { createHash } from "node:crypto";

/**
 * Deterministic UUID v5 (SHA-1-based, namespace + name). Used by the seed
 * generator to produce stable IDs for course/module/lesson/resource — the
 * same slug always yields the same UUID, so re-running the generator
 * produces a byte-identical seed file.
 *
 * Implemented inline (no `uuid` package dependency). The algorithm:
 *   1. SHA-1(namespace_bytes || name_bytes)
 *   2. Set the version (5) in byte 6, high nibble.
 *   3. Set the variant (RFC 4122) in byte 8, high bits.
 *   4. Format the first 16 bytes as a UUID string.
 */
const NAMESPACE = "9c3a7e2f-1b4d-4e8a-9f6c-3d5b7e9a1c2d"; // arbitrary, app-scoped

export function uuidv5(name: string): string {
  const namespaceBytes = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(namespaceBytes).update(name).digest();
  // Set version (5 = SHA-1) — high nibble of byte 6.
  hash[6] = ((hash[6] ?? 0) & 0x0f) | 0x50;
  // Set variant (RFC 4122) — high two bits of byte 8 become 10.
  hash[8] = ((hash[8] ?? 0) & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
