import path from "node:path";

import type { BlobStore } from "../src/adapters/persistence/blob-store/blob-store.ts";
import {
  CONTENT_LOCATIONS_FILE,
  loadContentLocations,
  type ContentLocations,
} from "../src/adapters/persistence/blob-store/content-locations/content-locations.ts";
import { contentBlobStoreFromEnv } from "../src/adapters/persistence/blob-store/create-content-blob-store/create-content-blob-store.ts";
import { allContentKeys } from "./content-keys/content-keys.ts";

/**
 * Checks every content key against the store the location manifest routes it
 * to, and reports the ones that do not resolve.
 *
 * @remarks
 * This is the guard against a manifest that claims a placement the bucket does
 * not have — the failure mode that `move-content.ts` prevents when it is used,
 * and that a hand-edited manifest reintroduces. Without it the first symptom
 * is a 404 in production.
 *
 * @param blobStore - The routed store to check against
 * @param keys - Content keys to check
 * @returns The keys that did not resolve, in the order given
 */
export async function unresolvedContentKeys(
  blobStore: BlobStore,
  keys: ReadonlyArray<string>,
): Promise<string[]> {
  const resolved = await Promise.all(keys.map((key) => blobStore.exists(key)));
  return keys.filter((_, index) => !resolved[index]);
}

/**
 * Declared `assets` entries whose key the seed no longer contains.
 *
 * @remarks
 * An exhaustive `assets` block goes stale the moment content is renamed or
 * removed and the seed is regenerated. Left unchecked the manifest accumulates
 * entries for keys nothing asks for, and a reader can no longer tell which
 * placements are real.
 *
 * Reported, never auto-pruned: a key vanishing from the seed usually means the
 * content was renamed, and the right fix is often to update the entry rather
 * than drop it.
 *
 * @param manifest - The parsed location manifest
 * @param seedKeys - Every content key the seed refers to
 * @returns The stale keys, sorted
 */
export function staleAssetKeys(
  manifest: ContentLocations,
  seedKeys: ReadonlyArray<string>,
): string[] {
  const known = new Set(seedKeys);
  return Object.keys(manifest.assets)
    .filter((key) => !known.has(key))
    .sort();
}

async function run(): Promise<void> {
  const keys = allContentKeys();
  const missing = await unresolvedContentKeys(contentBlobStoreFromEnv(), keys);
  const manifest = loadContentLocations(
    path.resolve(process.env.CONTENT_LOCATIONS_PATH ?? CONTENT_LOCATIONS_FILE),
  );
  const stale = manifest ? staleAssetKeys(manifest, keys) : [];

  if (missing.length > 0) {
    console.error(
      `[verify:content] ${missing.length} of ${keys.length} content keys do not resolve:\n  ${missing.join("\n  ")}`,
    );
  }
  if (stale.length > 0) {
    console.error(
      `[verify:content] ${stale.length} declared asset(s) name keys the seed no longer has:\n  ${stale.join("\n  ")}`,
    );
  }
  if (missing.length === 0 && stale.length === 0) {
    console.log(`[verify:content] All ${keys.length} content keys resolve.`);
    return;
  }
  process.exitCode = 1;
}

if (process.argv[1] && process.argv[1].endsWith("verify-content.ts")) {
  void run();
}
