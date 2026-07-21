import path from "node:path";

import { slugify } from "./slug";
import { SLUG_OVERRIDES } from "./slug-overrides";

/**
 * Single source of truth for turning a raw on-disk folder name into a
 * URL-safe slug. Used by BOTH the disk-normalization script and the seed
 * generator — they MUST share this function so the physical path of an
 * asset always equals the content key the generator emits. Two copies of
 * this logic is exactly the drift that caused seed URLs to 404.
 *
 * Resolution order: an explicit entry in `SLUG_OVERRIDES` (keyed by the raw
 * name as it appears on disk) wins; otherwise automatic `slugify`.
 */
export function resolveSlug(rawName: string): string {
  if (Object.prototype.hasOwnProperty.call(SLUG_OVERRIDES, rawName)) {
    return SLUG_OVERRIDES[rawName] as string;
  }
  return slugify(rawName);
}

/**
 * Normalizes a file basename to a URL-safe form: the stem is slugified and
 * the extension is lowercased and preserved (e.g.
 * `"Aprende Inglés….MP4"` → `"aprende-ingles-….mp4"`). Idempotent.
 *
 * Extension handling uses `path.extname`, so dotfiles like `.DS_Store`
 * (which have no extension per Node's rules) slugify whole — callers that
 * must not touch system files should filter them out before calling this.
 */
export function normalizeFileName(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = ext.length > 0 ? path.basename(fileName, ext) : fileName;
  return `${slugify(stem)}${ext.toLowerCase()}`;
}

/**
 * Normalizes a relative path to POSIX form (forward slashes), regardless of
 * platform. Rewrites BOTH the platform's `path.sep` AND literal backslashes
 * (which on POSIX are just regular characters but still appear in paths
 * serialized across machines with mixed separators). Use this whenever a
 * path is persisted to a portable artifact (manifest, seed) or compared
 * across platforms — both sides MUST go through this helper so writes and
 * reads stay symmetric.
 */
export function toPosix(p: string): string {
  return p.split(path.sep).join("/").replaceAll("\\", "/");
}
