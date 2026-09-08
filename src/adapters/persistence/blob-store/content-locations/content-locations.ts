import { existsSync, readFileSync } from "node:fs";

import { z } from "zod";

/**
 * Public URL prefix a local store falls back to — the folder Next.js serves
 * from `/public`. Matches the pre-manifest default exactly, so a content root
 * with no manifest and one declaring only a local store behave identically.
 */
export const DEFAULT_LOCAL_BASE_URL = "/local-filesystem-lesson";

/** File name the location manifest is read from, relative to the repo root. */
export const CONTENT_LOCATIONS_FILE = "content-locations.json";

/**
 * How long a signed URL stays valid, in seconds (6 hours).
 *
 * @remarks
 * Deliberately longer than any plausible viewing session. A signed URL that
 * expires mid-playback does not prompt a re-fetch — the `<video>` element's
 * range request to a dead URL simply fails, so seeking breaks. A leaked link to
 * one lesson is a far smaller problem than a player that stops working.
 */
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

/**
 * Whether a store's objects can be linked to directly.
 *
 * @remarks
 * `signed` is the default for cloud stores: a bucket is private until someone
 * says otherwise, and getting that backwards leaks the whole corpus. A signed
 * store's keys resolve to the app's own signing endpoint rather than to a
 * bucket URL.
 */
const Visibility = z.enum(["public", "signed"]);

/**
 * Where objects sit INSIDE a store, prepended to every key.
 *
 * @remarks
 * This is what keeps the content key free of placement. A bucket may organise
 * its objects under `v1/` without any key changing, and a key never encodes
 * which bucket holds it.
 */
const PathPrefix = z.string().default("");

/** Content served by Next.js from the local `/public` folder. */
const LocalStore = z.object({
  driver: z.literal("local"),
  /** Public URL prefix, without a trailing slash. */
  baseUrl: z.string().min(1).default(DEFAULT_LOCAL_BASE_URL),
  pathPrefix: PathPrefix,
});

/** Content in an S3 (or S3-compatible) bucket. */
const S3Store = z.object({
  driver: z.literal("s3"),
  bucket: z.string().min(1),
  region: z.string().min(1),
  /**
   * Custom endpoint for S3-compatible stores (R2, MinIO, LocalStack). Omit for
   * AWS itself, where the SDK derives the endpoint from the region.
   */
  endpoint: z.string().min(1).optional(),
  /** Path-style addressing, which most S3-compatible stores require. */
  forcePathStyle: z.boolean().default(false),
  pathPrefix: PathPrefix,
  visibility: Visibility.default("signed"),
  /** Public URL prefix (usually a CDN). Required when `visibility` is public. */
  publicUrl: z.string().min(1).optional(),
  /** Seconds a signed URL stays valid. See {@link DEFAULT_SIGNED_URL_TTL_SECONDS}. */
  signedUrlTtlSeconds: z.number().int().positive().optional(),
});

/** Content in a Google Cloud Storage bucket. */
const GcsStore = z.object({
  driver: z.literal("gcs"),
  bucket: z.string().min(1),
  /** Custom API endpoint, for emulators. Omit for Google Cloud itself. */
  apiEndpoint: z.string().min(1).optional(),
  pathPrefix: PathPrefix,
  visibility: Visibility.default("signed"),
  publicUrl: z.string().min(1).optional(),
  signedUrlTtlSeconds: z.number().int().positive().optional(),
});

/**
 * One declared store. The `driver` discriminates which fields apply.
 */
export const ContentStore = z.discriminatedUnion("driver", [LocalStore, S3Store, GcsStore]);

export type ContentStore = z.infer<typeof ContentStore>;

/**
 * Per-asset placement: where ONE key's bytes actually are.
 *
 * @remarks
 * The only layer that may change the object path. `routes` and `overrides`
 * describe migrations, and a migration preserves the object layout — if a
 * prefix could rewrite paths you could no longer predict where a key landed
 * without evaluating every rule. Confining path rewrites to a layer that names
 * a single key keeps the model closed.
 *
 * Exists for the assets inference cannot describe: one object shared by two
 * lessons, an object renamed inside a bucket, a file living outside the lesson
 * folder its key names.
 */
const AssetPlacement = z.object({
  /** Store that owns this asset. Omit to keep whatever routing decides. */
  store: z.string().min(1).optional(),
  /**
   * Full object path within the store, REPLACING both the key and the store's
   * `pathPrefix`. Omit to keep the key-derived path.
   */
  objectPath: z.string().min(1).optional(),
});

export type AssetPlacement = z.infer<typeof AssetPlacement>;

/** A prefix-to-store rule. The longest matching prefix wins. */
const ContentRoute = z.object({
  prefix: z.string().min(1),
  store: z.string().min(1),
});

/**
 * The `content-locations.json` document: which store answers for which key.
 *
 * @remarks
 * Read at RUNTIME when the dependency graph is built, never at build time.
 * Moving an asset rewrites this file and nothing else — in particular it never
 * regenerates `seed-content.ts`, because a content key is identity and does not
 * change when its bytes do.
 *
 * Credentials never appear here. Bucket names, regions and CDN URLs are not
 * secrets and belong in the tracked file; access keys come from the environment.
 */
export const ContentLocations = z.object({
  version: z.literal(1),
  stores: z.record(z.string().min(1), ContentStore),
  /** Store that answers for a key matching no override and no route. */
  default: z.string().min(1),
  routes: z.array(ContentRoute).default([]),
  /** Exact key → store name, for single assets that escape their prefix. */
  overrides: z.record(z.string().min(1), z.string().min(1)).default({}),
  /** Exact key → declared placement. Outranks every other layer. */
  assets: z.record(z.string().min(1), AssetPlacement).default({}),
});

export type ContentLocations = z.infer<typeof ContentLocations>;

/**
 * Parses the text of a `content-locations.json` into a validated manifest.
 *
 * @remarks
 * Throws rather than returning a `Result`: a manifest that does not describe
 * reality has no safe interpretation, and the only sane response is to refuse
 * to build the dependency graph. Falling back to defaults would serve every
 * asset from the wrong place, silently.
 *
 * @param text - Raw file contents
 * @returns The validated manifest, defaults applied
 * @throws if `text` is not valid JSON, fails the schema, or names an undeclared store
 */
export function parseContentLocations(text: string): ContentLocations {
  const parsed = ContentLocations.safeParse(readJson(text));
  if (!parsed.success) {
    throw new Error(`content-locations.json is invalid:\n${describeIssues(parsed.error)}`);
  }
  assertStoresResolve(parsed.data);
  assertPublicStoresHaveUrls(parsed.data);
  assertAssetsDeclareSomething(parsed.data);
  return parsed.data;
}

function readJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error("content-locations.json is not valid JSON", { cause });
  }
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
}

/**
 * Every store name referenced anywhere must be declared. A dangling reference
 * would otherwise fall through to `default` and serve the asset from the wrong
 * place with no error at all.
 */
function assertStoresResolve(manifest: ContentLocations): void {
  const declared = new Set(Object.keys(manifest.stores));
  const referenced: Array<{ where: string; name: string }> = [
    { where: "default", name: manifest.default },
    ...manifest.routes.map((route) => ({ where: `routes["${route.prefix}"]`, name: route.store })),
    ...Object.entries(manifest.overrides).map(([key, name]) => ({
      where: `overrides["${key}"]`,
      name,
    })),
    ...Object.entries(manifest.assets)
      .filter(([, placement]) => placement.store !== undefined)
      .map(([key, placement]) => ({
        where: `assets["${key}"]`,
        name: placement.store as string,
      })),
  ];

  const dangling = referenced.filter((reference) => !declared.has(reference.name));
  if (dangling.length > 0) {
    throw new Error(
      `content-locations.json references undeclared stores:\n${dangling
        .map((reference) => `  ${reference.where} → "${reference.name}"`)
        .join("\n")}`,
    );
  }
}

/**
 * An asset entry that declares neither a store nor a path changes nothing, and
 * is rejected rather than ignored: silently keeping the inferred placement
 * while the manifest appears to say otherwise is exactly the lie the manifest
 * exists to prevent.
 */
function assertAssetsDeclareSomething(manifest: ContentLocations): void {
  const empty = Object.entries(manifest.assets)
    .filter(([, placement]) => !placement.store && !placement.objectPath)
    .map(([key]) => key);

  if (empty.length > 0) {
    throw new Error(
      `content-locations.json declares assets with neither store nor objectPath: ${empty.join(", ")}`,
    );
  }
}

/** A public store with no `publicUrl` has no way to produce a URL at all. */
function assertPublicStoresHaveUrls(manifest: ContentLocations): void {
  const offenders = Object.entries(manifest.stores)
    .filter(([, store]) => store.driver !== "local")
    .filter((entry) => {
      const store = entry[1] as Extract<ContentStore, { visibility: unknown }>;
      return store.visibility === "public" && !store.publicUrl;
    })
    .map(([name]) => name);

  if (offenders.length > 0) {
    throw new Error(
      `content-locations.json declares public stores with no publicUrl: ${offenders.join(", ")}`,
    );
  }
}

/**
 * The store that answers for a content key.
 *
 * @remarks
 * Resolution order is a declared `assets` entry, then an exact override, then
 * the LONGEST matching route prefix, then the default. Three layers because
 * placement comes in three shapes: a module migrates as a prefix, a stray file
 * moves as one key, and an asset whose real path does not follow its key needs
 * that path declared. Expressing any one through another is impractical.
 *
 * A prefix matches on path boundaries, not as a substring, so `course/` never
 * captures `coursework/`.
 *
 * @param key - The content key, exactly as it appears in the seed
 * @param manifest - The parsed location manifest
 * @returns The name of the store that owns this key
 */
export function resolveStoreNameFor(key: string, manifest: ContentLocations): string {
  const declared = manifest.assets[key]?.store;
  if (declared !== undefined) return declared;

  const override = manifest.overrides[key];
  if (override !== undefined) return override;

  const longestMatch = manifest.routes
    .filter((route) => matchesPrefix(key, route.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return longestMatch?.store ?? manifest.default;
}

/**
 * Whether `key` sits under `prefix`, treating `/` as a boundary so a prefix
 * cannot capture a longer sibling name.
 */
function matchesPrefix(key: string, prefix: string): boolean {
  const boundedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return key === prefix || key.startsWith(boundedPrefix);
}

/**
 * Where a key's bytes sit inside its store.
 *
 * @remarks
 * The key is identity and never changes when an asset moves; the object path
 * is placement and may. Keeping them separate is what lets a bucket reorganise
 * without rewriting `seed-content.ts`.
 *
 * @param key - The content key
 * @param store - The store the key routes to
 * @returns The object path within that store
 */
/**
 * Where a key's bytes sit, honouring a declared placement.
 *
 * @remarks
 * Prefer this over {@link objectPathFor} wherever the manifest is in hand: a
 * declared `objectPath` replaces BOTH the key and the store's `pathPrefix`, and
 * only this function knows that.
 *
 * @param key - The content key
 * @param manifest - The parsed location manifest
 * @returns The object path within whichever store owns the key
 */
export function resolveObjectPathFor(key: string, manifest: ContentLocations): string {
  const declared = manifest.assets[key]?.objectPath;
  if (declared !== undefined) return declared;

  const store = manifest.stores[resolveStoreNameFor(key, manifest)] as ContentStore;
  return objectPathFor(key, store);
}

/**
 * Where a key's bytes sit inside a GIVEN store, by inference alone.
 *
 * @remarks
 * Ignores any declared placement, so it answers "where would this key live in
 * this store" — which is what a move needs when it is deciding where to put an
 * object. Callers resolving a key for reading want
 * {@link resolveObjectPathFor} instead.
 */
export function objectPathFor(key: string, store: ContentStore): string {
  if (store.pathPrefix.length === 0) return key;
  const prefix = store.pathPrefix.endsWith("/") ? store.pathPrefix : `${store.pathPrefix}/`;
  return `${prefix}${key}`;
}

/**
 * Reads and validates the location manifest at `filePath`.
 *
 * @remarks
 * Absence and invalidity mean different things. No manifest is a deployment
 * that has not been configured, and the caller falls back to
 * {@link singleLocalStoreManifest} — the pre-manifest behaviour. A manifest
 * that exists but does not validate is an authoring mistake, and aborts.
 *
 * @param filePath - Path to `content-locations.json`
 * @returns The parsed manifest, or `null` when the file does not exist
 * @throws if the manifest exists but is invalid
 */
export function loadContentLocations(filePath: string): ContentLocations | null {
  if (!existsSync(filePath)) return null;
  return parseContentLocations(readFileSync(filePath, "utf8"));
}

/**
 * The manifest an unconfigured deployment behaves as: one local store, serving
 * everything from the folder Next.js already serves.
 *
 * @remarks
 * Returning a real manifest rather than a special case means every caller has
 * exactly one code path — the routing store never has to ask whether a manifest
 * exists.
 *
 * @returns A manifest with a single `local` store as the default
 */
export function singleLocalStoreManifest(): ContentLocations {
  return ContentLocations.parse({
    version: 1,
    stores: { local: { driver: "local" } },
    default: "local",
  });
}
