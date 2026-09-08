import path from "node:path";

import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  CONTENT_LOCATIONS_FILE,
  loadContentLocations,
  singleLocalStoreManifest,
  type ContentLocations,
  type ContentStore,
} from "@/adapters/persistence/blob-store/content-locations/content-locations";
import { GcsBlobStore } from "@/adapters/persistence/blob-store/gcs-blob-store/gcs-blob-store";
import { LocalFilesystemBlobStore } from "@/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store";
import { RoutingBlobStore } from "@/adapters/persistence/blob-store/routing-blob-store/routing-blob-store";
import { S3BlobStore } from "@/adapters/persistence/blob-store/s3-blob-store/s3-blob-store";

/**
 * Builds the application's `BlobStore` from the location manifest.
 *
 * @remarks
 * This is the one place that turns declared placement into working drivers.
 * With no manifest on disk it produces a store indistinguishable from the
 * single local driver the app used before routing existed, so an unconfigured
 * deployment keeps working unchanged.
 *
 * @param params.manifestPath - Path to `content-locations.json`
 * @param params.localRoot - Absolute filesystem path the local driver reads from
 * @returns A store that routes each key to the store that owns it
 * @throws if the manifest exists but is invalid, or declares a driver that is
 *   not supported
 *
 * @category Adapters
 */
export function createContentBlobStore(params: {
  manifestPath: string;
  localRoot: string;
}): RoutingBlobStore {
  const manifest = loadContentLocations(params.manifestPath) ?? singleLocalStoreManifest();
  return new RoutingBlobStore({
    manifest,
    drivers: buildDrivers(manifest, () => params.localRoot),
  });
}

/**
 * One driver per store the manifest declares.
 *
 * @remarks
 * Exported for `scripts/move-content.ts`, which copies objects BETWEEN stores
 * and so needs both drivers rather than the routing view over them.
 *
 * @param manifest - The parsed location manifest
 * @param localRootFor - The filesystem root each local store reads from. A
 *   function rather than one path because a move copies BETWEEN local stores,
 *   which then sit at different roots.
 * @returns Drivers keyed by store name
 */
export function buildDrivers(
  manifest: ContentLocations,
  localRootFor: (storeName: string) => string,
): Record<string, BlobStore> {
  return Object.fromEntries(
    Object.entries(manifest.stores).map(([name, store]) => [
      name,
      buildDriver(name, store, localRootFor(name)),
    ]),
  );
}

function buildDriver(name: string, store: ContentStore, localRoot: string): BlobStore {
  switch (store.driver) {
    case "local":
      return new LocalFilesystemBlobStore({ baseUrl: store.baseUrl, localRoot });
    case "s3":
      return new S3BlobStore({
        bucket: store.bucket,
        region: store.region,
        ...(store.endpoint ? { endpoint: store.endpoint } : {}),
        ...(store.forcePathStyle ? { forcePathStyle: true } : {}),
        ...(store.publicUrl ? { publicUrl: store.publicUrl } : {}),
      });
    case "gcs":
      return new GcsBlobStore({
        bucket: store.bucket,
        ...(store.apiEndpoint ? { apiEndpoint: store.apiEndpoint } : {}),
        ...(store.publicUrl ? { publicUrl: store.publicUrl } : {}),
      });
    default:
      throw new Error(
        `content-locations.json store "${name}" uses unsupported driver "${(store as { driver: string }).driver}"`,
      );
  }
}

/** Default filesystem root the local driver reads bytes from. */
const DEFAULT_CONTENT_LOCAL_ROOT = "public/local-filesystem-lesson";

/**
 * The application's `BlobStore`, configured from the environment.
 *
 * @remarks
 * Read per call rather than at module load, so a developer can repoint content
 * in dev without restarting the Node process. Both callers — the dependency
 * graph and the signing endpoint — go through here, so they can never disagree
 * about where content lives.
 *
 * The two variables are deliberately machine-scoped rather than placement
 * decisions: `CONTENT_LOCATIONS_PATH` says where the manifest is, and
 * `CONTENT_LOCAL_ROOT` says where the local driver reads bytes from. WHICH
 * store owns an asset is the manifest's job. Neither is `NEXT_PUBLIC_`:
 * resolution happens on the server and resolved URLs reach the client as plain
 * props.
 *
 * @category Adapters
 */
export function contentBlobStoreFromEnv(): RoutingBlobStore {
  return createContentBlobStore({
    manifestPath: path.resolve(process.env.CONTENT_LOCATIONS_PATH ?? CONTENT_LOCATIONS_FILE),
    localRoot: path.resolve(process.env.CONTENT_LOCAL_ROOT ?? DEFAULT_CONTENT_LOCAL_ROOT),
  });
}
