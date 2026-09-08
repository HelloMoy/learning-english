import { writeFileSync } from "node:fs";
import path from "node:path";

import {
  loadContentLocations,
  resolveObjectPathFor,
  resolveStoreNameFor,
  type AssetPlacement,
  type ContentLocations,
} from "../src/adapters/persistence/blob-store/content-locations/content-locations.ts";
import { allContentKeys } from "./content-keys/content-keys.ts";

export type MaterializeResult = {
  /** How many keys the `assets` block now declares. */
  written: number;
};

/**
 * Writes every content key's current placement into the manifest's `assets`
 * block, turning inferred placement into declared placement.
 *
 * @remarks
 * This is what makes an exhaustive manifest — every asset's location written
 * down rather than derived from its key — one command instead of 319 hand-typed
 * entries. Hand-typing them is the erratum risk that inference avoided;
 * generating them is not, and generation additionally guarantees that
 * materializing moves nothing: each entry records what routing already resolved.
 *
 * Idempotent. A run that follows a run with no content or routing change in
 * between rewrites the file byte-for-byte, so a no-op never looks like a change
 * in review.
 *
 * A declared `objectPath` that diverges from the key-derived one is preserved:
 * it records a decision the content walk cannot rediscover, and re-deriving it
 * would silently undo it.
 *
 * @param params.manifestPath - Path to `content-locations.json`
 * @param params.keys - Keys to declare. Defaults to the generated seed's inventory.
 * @returns How many entries the `assets` block holds afterwards
 * @throws if there is no manifest at `manifestPath`
 */
export function materializeContentAssets(params: {
  manifestPath: string;
  keys?: ReadonlyArray<string>;
}): MaterializeResult {
  const manifest = loadContentLocations(params.manifestPath);
  if (!manifest) throw new Error(`No manifest at ${params.manifestPath}`);

  const keys = [...(params.keys ?? allContentKeys())].sort();
  const assets = Object.fromEntries(keys.map((key) => [key, placementOf(key, manifest)]));

  writeFileSync(params.manifestPath, render({ ...manifest, assets }), "utf8");
  return { written: keys.length };
}

/**
 * What this key resolves to today. Reading it back through the same resolvers
 * the app uses is what makes the written entry equal to the current behaviour
 * rather than a re-derivation of it — which is also what preserves a declared
 * divergent path.
 */
function placementOf(key: string, manifest: ContentLocations): AssetPlacement {
  return {
    store: resolveStoreNameFor(key, manifest),
    objectPath: resolveObjectPathFor(key, manifest),
  };
}

/** Two-space JSON with a trailing newline — what Prettier would produce. */
function render(manifest: ContentLocations): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

// ── CLI ──────────────────────────────────────────────────────────────────

const HELP_TEXT = `Usage: tsx scripts/materialize-content-assets.ts [options]

Writes every content key's current placement into the manifest's "assets"
block. Changes no URL: each entry records what routing already resolved.

Options:
  --manifest <path>  Location manifest (default: content-locations.json)
  --help, -h         Show this help
`;

function run(): void {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP_TEXT);
    return;
  }
  const flag = argv.indexOf("--manifest");
  const manifestPath = path.resolve(
    flag >= 0 && argv[flag + 1] ? (argv[flag + 1] as string) : "content-locations.json",
  );
  try {
    const { written } = materializeContentAssets({ manifestPath });
    console.log(`[materialize] Declared ${written} assets → ${manifestPath}`);
  } catch (err) {
    console.error("[materialize] FAILED:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith("materialize-content-assets.ts")) {
  run();
}
