import { assertSafeKey } from "@/adapters/persistence/blob-store/blob-key/blob-key";
import { isSignedUrlSource, type BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  DEFAULT_SIGNED_URL_TTL_SECONDS,
  resolveObjectPathFor,
  resolveStoreNameFor,
  type ContentLocations,
  type ContentStore,
} from "@/adapters/persistence/blob-store/content-locations/content-locations";

/**
 * Site-relative prefix of the endpoint that signs and redirects to a private
 * store's object. Keys routed to a `signed` store resolve here instead of to a
 * bucket URL.
 */
export const CONTENT_SIGNING_ENDPOINT = "/api/content";

/**
 * Driven adapter: a `BlobStore` that fans out over several stores.
 *
 * @remarks
 * This is the layer that makes "the asset moved" a configuration change. It
 * decides WHICH store answers for a key and WHAT path that key has inside it;
 * the drivers below it know only how to resolve a path within one store.
 *
 * It deliberately does not widen the `BlobStore` interface. In particular
 * {@link RoutingBlobStore.url} stays synchronous, so nothing propagates into
 * the lesson, resource and notes adapters, into entity construction, or into
 * the domain. Private stores are reached through {@link CONTENT_SIGNING_ENDPOINT},
 * which is what buys that: signing is asynchronous, a redirect is not.
 *
 * @example
 * ```ts
 * const store = new RoutingBlobStore({
 *   manifest: loadContentLocations("content-locations.json") ?? singleLocalStoreManifest(),
 *   drivers: { local: new LocalFilesystemBlobStore({ baseUrl, localRoot }) },
 * });
 * store.url("course/module/lesson/video.mp4");
 * ```
 *
 * @category Adapters
 */
export class RoutingBlobStore implements BlobStore {
  readonly #manifest: ContentLocations;
  readonly #drivers: Readonly<Record<string, BlobStore>>;

  /**
   * @param params.manifest - The parsed location manifest
   * @param params.drivers - One driver per store name the manifest declares
   * @throws if any declared store has no driver — a gap that would otherwise
   *   surface as a runtime failure on whichever page happened to need it first
   */
  constructor(params: { manifest: ContentLocations; drivers: Record<string, BlobStore> }) {
    assertEveryStoreHasADriver(params.manifest, params.drivers);
    this.#manifest = params.manifest;
    this.#drivers = { ...params.drivers };
  }

  url(key: string): string {
    assertSafeKey(key);
    const store = this.#storeFor(key);
    if (isSigned(store)) return signingEndpointUrlFor(key);
    return this.#driverFor(key).url(this.#objectPathFor(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      assertSafeKey(key);
    } catch {
      return false;
    }
    return this.#driverFor(key).exists(this.#objectPathFor(key));
  }

  async readText(key: string): Promise<string> {
    assertSafeKey(key);
    return this.#driverFor(key).readText(this.#objectPathFor(key));
  }

  /**
   * Whether this key's store is private, and therefore reachable only through
   * a signed URL.
   */
  isSignedKey(key: string): boolean {
    assertSafeKey(key);
    return isSigned(this.#storeFor(key));
  }

  /**
   * A time-limited URL granting read access to a private store's object.
   *
   * @remarks
   * Asynchronous, and deliberately NOT part of `BlobStore`. Only the signing
   * endpoint calls it, and only it can afford to await; keeping it off the
   * synchronous interface is what stops `async` from spreading into entity
   * construction.
   *
   * @param key - The content key
   * @returns A signed URL valid for the store's TTL
   * @throws if the key is unsafe, its store is public, or its driver cannot sign
   */
  async signedUrlFor(key: string): Promise<string> {
    assertSafeKey(key);
    const store = this.#storeFor(key);
    const storeName = resolveStoreNameFor(key, this.#manifest);
    if (!isSigned(store)) {
      throw new Error(`Store "${storeName}" is not signed; its objects have public URLs`);
    }

    const driver = this.#driverFor(key);
    if (!isSignedUrlSource(driver)) {
      throw new Error(`Driver for store "${storeName}" cannot mint signed URLs`);
    }
    return driver.signedUrl(this.#objectPathFor(key), signedUrlTtlFor(store));
  }

  /**
   * Where `key`'s bytes sit in its store — a declared `assets` path when there
   * is one, otherwise the key under the store's `pathPrefix`.
   */
  #objectPathFor(key: string): string {
    return resolveObjectPathFor(key, this.#manifest);
  }

  /** The store declaration that owns `key`. */
  #storeFor(key: string): ContentStore {
    return this.#manifest.stores[resolveStoreNameFor(key, this.#manifest)] as ContentStore;
  }

  /** The driver for the store that owns `key`. */
  #driverFor(key: string): BlobStore {
    return this.#drivers[resolveStoreNameFor(key, this.#manifest)] as BlobStore;
  }
}

/** How long this store's signed URLs stay valid. */
function signedUrlTtlFor(store: ContentStore): number {
  if (store.driver === "local") return DEFAULT_SIGNED_URL_TTL_SECONDS;
  return store.signedUrlTtlSeconds ?? DEFAULT_SIGNED_URL_TTL_SECONDS;
}

/** Whether a store's objects can only be reached through a signed URL. */
export function isSigned(store: ContentStore): boolean {
  return store.driver !== "local" && store.visibility === "signed";
}

/**
 * The site-relative URL of the signing endpoint for a key.
 *
 * @remarks
 * Each segment is percent-encoded separately so the path separators survive.
 * Keys are kebab-case ASCII by contract, but this must not be the code that
 * assumes it — an unescaped `?` would silently start a query string.
 */
function signingEndpointUrlFor(key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${CONTENT_SIGNING_ENDPOINT}/${encoded}`;
}

function assertEveryStoreHasADriver(
  manifest: ContentLocations,
  drivers: Record<string, BlobStore>,
): void {
  const missing = Object.keys(manifest.stores).filter((name) => !(name in drivers));
  if (missing.length > 0) {
    throw new Error(`RoutingBlobStore has no driver for declared store(s): ${missing.join(", ")}`);
  }
}
