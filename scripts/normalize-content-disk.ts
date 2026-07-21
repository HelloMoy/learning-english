import { readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { normalizeFileName, resolveSlug, toPosix } from "./resolve-slug.ts";

/**
 * Renames every folder and file under a content root to its kebab-case slug
 * form, so the physical layout matches the content keys the seed generator
 * emits (see `openspec/changes/normalize-course-content-disk-layout`). It
 * uses the SAME slug logic as the generator (`resolveSlug` for folders,
 * `normalizeFileName` for files) — that shared function is the guarantee
 * that disk paths and emitted keys never drift apart again.
 *
 * Safety model:
 *  - Dry-run by default: prints the `old → new` plan, mutates nothing.
 *    `apply: true` performs the renames and writes `rename-manifest.json`.
 *  - Idempotent: re-running against an already-normalized tree is a no-op.
 *  - Collision-guarded: if two distinct entries in one directory normalize
 *    to the same slug, it throws WITHOUT renaming anything in that directory.
 *  - Case-only renames go through a temp name (safe on case-insensitive FS).
 *  - Hidden/system entries (dotfiles like `.DS_Store`) are skipped.
 */

const MANIFEST_FILE = "rename-manifest.json";

export type RenameEntry = { from: string; to: string };

export type NormalizeResult = {
  /** Rename operations, `from`/`to` as posix paths relative to `rootDir`. */
  renames: RenameEntry[];
  /** Absolute path to the written manifest, or null in dry-run. */
  manifestPath: string | null;
  applied: boolean;
};

function targetName(name: string, isDir: boolean): string {
  return isDir ? resolveSlug(name) : normalizeFileName(name);
}

function isHidden(name: string): boolean {
  return name.startsWith(".") || name === MANIFEST_FILE;
}

/**
 * Renames one node, routing case-only changes (e.g. `Intro` → `intro`)
 * through a temp name so it works on case-insensitive filesystems.
 */
function renameOnDisk(oldAbs: string, newAbs: string): void {
  if (oldAbs === newAbs) return;
  const oldBase = path.basename(oldAbs);
  const newBase = path.basename(newAbs);
  if (oldBase !== newBase && oldBase.toLowerCase() === newBase.toLowerCase()) {
    // Case-only change: go through a hidden sibling temp name so it works on
    // case-insensitive filesystems (macOS APFS default).
    const tmp = path.join(path.dirname(newAbs), `.rename-tmp-${newBase}`);
    renameSync(oldAbs, tmp);
    renameSync(tmp, newAbs);
    return;
  }
  renameSync(oldAbs, newAbs);
}

/**
 * Recursively normalizes `dirAbs`. Processes each child fully (recurse, then
 * rename the child itself) so renames happen bottom-up and never invalidate
 * a not-yet-processed path. Collects rename entries into `renames`.
 */
function normalizeDir(
  dirAbs: string,
  originalRelPrefix: string,
  slugRelPrefix: string,
  apply: boolean,
  renames: RenameEntry[],
): void {
  const dirents = readdirSync(dirAbs, { withFileTypes: true }).filter((d) => !isHidden(d.name));

  // Collision guard: two distinct names normalizing to the same slug cannot
  // coexist. Abort before mutating anything in this directory.
  const byTarget = new Map<string, string[]>();
  for (const d of dirents) {
    const t = targetName(d.name, d.isDirectory());
    const arr = byTarget.get(t) ?? [];
    arr.push(d.name);
    byTarget.set(t, arr);
  }
  const collisions = [...byTarget.entries()].filter(([, sources]) => sources.length > 1);
  if (collisions.length > 0) {
    const detail = collisions
      .map(([t, sources]) => `  "${t}" ⇐ ${sources.map((s) => `"${s}"`).join(", ")}`)
      .join("\n");
    throw new Error(
      `Slug collision in "${dirAbs || "."}" — distinct names normalize to the same slug:\n${detail}`,
    );
  }

  for (const d of dirents) {
    const isDir = d.isDirectory();
    const slugName = targetName(d.name, isDir);
    const childOldAbs = path.join(dirAbs, d.name);
    const originalRel = joinPosix(originalRelPrefix, d.name);
    const slugRel = joinPosix(slugRelPrefix, slugName);

    if (isDir) {
      // Recurse using the CURRENT (old) directory path; its future slug path
      // is the prefix for descendants.
      normalizeDir(childOldAbs, originalRel, slugRel, apply, renames);
    }

    if (originalRel !== slugRel) {
      renames.push({ from: originalRel, to: slugRel });
      if (apply) {
        renameOnDisk(childOldAbs, path.join(dirAbs, slugName));
      }
    }
  }
}

function joinPosix(prefix: string, name: string): string {
  return toPosix(prefix.length > 0 ? `${prefix}/${name}` : name);
}

/**
 * Normalizes the tree under `rootDir`. `rootDir` itself is not renamed.
 */
export function normalizeContentDisk(args: { rootDir: string; apply?: boolean }): NormalizeResult {
  const { rootDir, apply = false } = args;
  if (!statSync(rootDir).isDirectory()) {
    throw new Error(`Not a directory: ${rootDir}`);
  }

  const renames: RenameEntry[] = [];
  normalizeDir(rootDir, "", "", apply, renames);

  let manifestPath: string | null = null;
  if (apply) {
    manifestPath = path.join(rootDir, MANIFEST_FILE);
    writeFileSync(manifestPath, JSON.stringify({ version: 1, entries: renames }, null, 2), "utf8");
  }

  return { renames, manifestPath, applied: apply };
}

// ── CLI ──────────────────────────────────────────────────────────────────

type Args = { source: string; apply: boolean; help: boolean };

function parseArgs(argv: ReadonlyArray<string>): Args {
  let source = "public/local-filesystem-lesson";
  let apply = false;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--apply") apply = true;
    else if (arg === "--source" && argv[i + 1]) {
      source = argv[i + 1] as string;
      i++;
    }
  }
  return { source, apply, help };
}

const HELP_TEXT = `Usage: tsx scripts/normalize-content-disk.ts [options]

Renames every folder and file under <source> to its kebab-case slug form so
the disk layout matches the seed generator's content keys.

Options:
  --source <dir>   Content root (default: public/local-filesystem-lesson)
  --apply          Perform renames and write rename-manifest.json.
                   Without this flag, runs in DRY-RUN (prints the plan only).
  --help, -h       Show this help
`;

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }
  const rootDir = path.resolve(args.source);
  try {
    const result = normalizeContentDisk({ rootDir, apply: args.apply });
    if (result.renames.length === 0) {
      console.log("[normalize] Nothing to rename — tree is already normalized.");
      return;
    }
    if (args.apply) {
      console.log(`[normalize] Renamed ${result.renames.length} entries.`);
      console.log(`[normalize] Wrote manifest → ${result.manifestPath}`);
    } else {
      console.log(`[normalize] DRY-RUN — ${result.renames.length} entries would be renamed:`);
      for (const r of result.renames) {
        console.log(`  ${r.from}  →  ${r.to}`);
      }
      console.log("\n[normalize] Re-run with --apply to perform these renames.");
    }
  } catch (err) {
    console.error("[normalize] FAILED:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith("normalize-content-disk.ts")) {
  run();
}
