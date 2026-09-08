import { writeFileSync } from "node:fs";
import path from "node:path";

import {
  isTransferable,
  type BlobStore,
} from "../src/adapters/persistence/blob-store/blob-store.ts";
import {
  loadContentLocations,
  objectPathFor,
  resolveStoreNameFor,
  type ContentLocations,
} from "../src/adapters/persistence/blob-store/content-locations/content-locations.ts";
import { buildDrivers } from "../src/adapters/persistence/blob-store/create-content-blob-store/create-content-blob-store.ts";
import { allContentKeys } from "./content-keys/content-keys.ts";

/** What a completed move did. */
export type MoveResult = {
  /** Keys whose bytes were copied to the target during this run. */
  copied: string[];
  /** Keys already present at the target, left alone. */
  alreadyThere: string[];
  /** Keys whose source objects were removed, when `deleteSource` was asked for. */
  deleted: string[];
};

export type MoveContentParams = {
  manifestPath: string;
  /** Filesystem root per local store. Missing entries fall back to `localRoot`. */
  localRoots?: Record<string, string>;
  localRoot?: string;
  /** A content key, or a key prefix ending in `/`. */
  selector: string;
  toStore: string;
  /** The content inventory to select from. Defaults to the generated seed. */
  keys?: ReadonlyArray<string>;
  /** Remove the source objects after every copy has been verified. */
  deleteSource?: boolean;
};

/**
 * Moves content to another store and records the move in the location manifest.
 *
 * @remarks
 * The ordering is the point. Bytes are copied, then every copy is verified at
 * the destination, and only then is the manifest rewritten — so an interrupted
 * move leaves the manifest pointing at bytes that are still where they were. A
 * manifest edited by hand has no such guarantee, which is why this exists.
 *
 * Deleting the source is a separate opt-in step that runs after the manifest
 * is written, so a move is never the last copy of anything.
 *
 * A selector ending in `/` is a prefix and becomes a route; an exact key
 * becomes an override. That mirrors how the two are meant to be used: a module
 * migrates as a prefix, a stray file moves as one key.
 *
 * @param params - Which keys to move, where to, and whether to clean up
 * @returns What was copied, skipped and deleted
 * @throws if the target store is undeclared, the selector matches nothing, a
 *   driver cannot transfer, or any copy fails to verify
 */
export async function moveContent(params: MoveContentParams): Promise<MoveResult> {
  const manifest = loadContentLocations(params.manifestPath);
  if (!manifest) throw new Error(`No manifest at ${params.manifestPath}`);

  const target = manifest.stores[params.toStore];
  if (!target) {
    throw new Error(`content-locations.json declares no store "${params.toStore}"`);
  }

  const keys = selectKeys(params.keys ?? allContentKeys(), params.selector);
  if (keys.length === 0) {
    throw new Error(`Selector "${params.selector}" matches no content keys in the seed`);
  }

  const drivers = buildDrivers(manifest, (name) => localRootFor(name, params));
  const targetDriver = transferable(drivers, params.toStore);

  const copied: string[] = [];
  const alreadyThere: string[] = [];
  for (const key of keys) {
    const targetPath = objectPathFor(key, target);
    if (await targetDriver.exists(targetPath)) {
      alreadyThere.push(key);
      continue;
    }
    await copyOne(key, { manifest, drivers, toStore: params.toStore });
    copied.push(key);
  }

  await assertAllPresent(keys, targetDriver, target, params.toStore);
  writeFileSync(
    params.manifestPath,
    `${JSON.stringify(withPlacement(manifest, params.selector, params.toStore), null, 2)}\n`,
    "utf8",
  );

  const deleted = params.deleteSource
    ? await removeSources(keys, { manifest, drivers, toStore: params.toStore })
    : [];
  return { copied, alreadyThere, deleted };
}

/** Keys under a prefix, or the single key an exact selector names. */
function selectKeys(keys: ReadonlyArray<string>, selector: string): string[] {
  if (!selector.endsWith("/")) return keys.filter((key) => key === selector);
  return keys.filter((key) => key.startsWith(selector));
}

function localRootFor(storeName: string, params: MoveContentParams): string {
  const root = params.localRoots?.[storeName] ?? params.localRoot;
  if (!root) throw new Error(`No local root configured for store "${storeName}"`);
  return path.resolve(root);
}

type Transfer = { manifest: ContentLocations; drivers: Record<string, BlobStore>; toStore: string };

async function copyOne(key: string, transfer: Transfer): Promise<void> {
  const fromStoreName = resolveStoreNameFor(key, transfer.manifest);
  if (fromStoreName === transfer.toStore) return;

  const source = transferable(transfer.drivers, fromStoreName);
  const target = transferable(transfer.drivers, transfer.toStore);
  const bytes = await source.readBytes(
    objectPathFor(key, transfer.manifest.stores[fromStoreName]!),
  );
  await target.write(objectPathFor(key, transfer.manifest.stores[transfer.toStore]!), bytes);
}

async function removeSources(keys: string[], transfer: Transfer): Promise<string[]> {
  const removed: string[] = [];
  for (const key of keys) {
    const fromStoreName = resolveStoreNameFor(key, transfer.manifest);
    if (fromStoreName === transfer.toStore) continue;
    const source = transferable(transfer.drivers, fromStoreName);
    await source.remove(objectPathFor(key, transfer.manifest.stores[fromStoreName]!));
    removed.push(key);
  }
  return removed;
}

async function assertAllPresent(
  keys: string[],
  targetDriver: BlobStore,
  target: ContentLocations["stores"][string],
  toStore: string,
): Promise<void> {
  const missing: string[] = [];
  for (const key of keys) {
    if (!(await targetDriver.exists(objectPathFor(key, target)))) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} object(s) did not verify in "${toStore}"; the manifest was left unchanged:\n  ${missing.join("\n  ")}`,
    );
  }
}

/** The manifest with this selector's placement recorded. */
function withPlacement(
  manifest: ContentLocations,
  selector: string,
  toStore: string,
): ContentLocations {
  if (!selector.endsWith("/")) {
    return { ...manifest, overrides: { ...manifest.overrides, [selector]: toStore } };
  }
  const routes = manifest.routes.filter((route) => route.prefix !== selector);
  return { ...manifest, routes: [...routes, { prefix: selector, store: toStore }] };
}

function transferable(drivers: Record<string, BlobStore>, storeName: string) {
  const driver = drivers[storeName];
  if (!driver || !isTransferable(driver)) {
    throw new Error(`Driver for store "${storeName}" cannot copy objects`);
  }
  return driver;
}

// ── CLI ──────────────────────────────────────────────────────────────────

const HELP_TEXT = `Usage: tsx scripts/move-content.ts --to <store> --select <key|prefix/> [options]

Copies content to another store, verifies every copy at the destination, and
only then records the placement in content-locations.json.

Options:
  --to <store>       Target store, as named in content-locations.json
  --select <sel>     A content key, or a key prefix ending in "/"
  --manifest <path>  Location manifest (default: content-locations.json)
  --local-root <dir> Filesystem root for local stores
                     (default: public/local-filesystem-lesson)
  --delete-source    Remove the source objects AFTER every copy verifies
  --help, -h         Show this help
`;

function parseArgs(argv: ReadonlyArray<string>): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--delete-source") args.deleteSource = true;
    else if (arg?.startsWith("--") && argv[i + 1]) {
      args[arg.slice(2)] = argv[i + 1] as string;
      i++;
    }
  }
  return args;
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.to || !args.select) {
    console.log(HELP_TEXT);
    return;
  }
  try {
    const result = await moveContent({
      manifestPath: path.resolve((args.manifest as string) ?? "content-locations.json"),
      localRoot: (args["local-root"] as string) ?? "public/local-filesystem-lesson",
      selector: args.select as string,
      toStore: args.to as string,
      deleteSource: args.deleteSource === true,
    });
    console.log(
      `[move-content] Copied ${result.copied.length}, already present ${result.alreadyThere.length}, deleted ${result.deleted.length}.`,
    );
  } catch (err) {
    console.error("[move-content] FAILED:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith("move-content.ts")) {
  void run();
}
