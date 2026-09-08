import {
  assertSafeKey,
  assertTextKey,
  InvalidBlobKeyError,
  MAX_TEXT_BYTES,
} from "@/adapters/persistence/blob-store/blob-key/blob-key";
import type {
  BlobStore,
  SignedUrlSource,
  TransferableBlobStore,
} from "@/adapters/persistence/blob-store/blob-store";

import { Storage, type Bucket } from "@google-cloud/storage";

/** Everything the driver needs to talk to one bucket. */
export type GcsBlobStoreConfig = {
  bucket: string;
  /** Custom API endpoint, for emulators. Omit for Google Cloud itself. */
  apiEndpoint?: string;
  /** Public URL prefix, usually a CDN. Absent for a private bucket. */
  publicUrl?: string;
};

/**
 * Driven adapter: Google Cloud Storage-backed `BlobStore`.
 *
 * @remarks
 * The GCS counterpart of `S3BlobStore`, with the same contract: it resolves an
 * object path within ONE bucket and knows nothing about content keys or
 * routing. `RoutingBlobStore` composes the object path before delegating here.
 *
 * Credentials come from the ambient Google application-default credential
 * chain — never from the location manifest, which is tracked in git.
 *
 * @category Adapters
 */
export class GcsBlobStore implements BlobStore, SignedUrlSource, TransferableBlobStore {
  readonly #bucket: Bucket;
  readonly #bucketName: string;
  readonly #publicUrl: string | undefined;

  constructor(config: GcsBlobStoreConfig) {
    this.#bucketName = config.bucket;
    this.#publicUrl = config.publicUrl ? stripTrailingSlash(config.publicUrl) : undefined;
    this.#bucket = new Storage(
      config.apiEndpoint ? { apiEndpoint: config.apiEndpoint, projectId: "test" } : {},
    ).bucket(config.bucket);
  }

  url(objectPath: string): string {
    assertSafeKey(objectPath);
    if (!this.#publicUrl) {
      throw new Error(
        `GCS bucket "${this.#bucketName}" declares no publicUrl; private objects are served through the signing endpoint`,
      );
    }
    return `${this.#publicUrl}/${objectPath}`;
  }

  async exists(objectPath: string): Promise<boolean> {
    try {
      assertSafeKey(objectPath);
    } catch {
      return false;
    }
    try {
      const [exists] = await this.#bucket.file(objectPath).exists();
      return exists;
    } catch {
      return false;
    }
  }

  async readText(objectPath: string): Promise<string> {
    assertSafeKey(objectPath);
    assertTextKey(objectPath);

    const body = await this.#download(objectPath);
    if (body.byteLength > MAX_TEXT_BYTES) {
      throw new InvalidBlobKeyError(objectPath, "too-large");
    }
    return body.toString("utf8");
  }

  async signedUrl(objectPath: string, ttlSeconds: number): Promise<string> {
    assertSafeKey(objectPath);
    const [url] = await this.#bucket.file(objectPath).getSignedUrl({
      action: "read",
      expires: Date.now() + ttlSeconds * 1000,
      version: "v4",
    });
    return url;
  }

  async readBytes(objectPath: string): Promise<Uint8Array> {
    assertSafeKey(objectPath);
    return this.#download(objectPath);
  }

  async write(objectPath: string, body: Uint8Array): Promise<void> {
    assertSafeKey(objectPath);
    // Non-resumable: a resumable upload streams the body, and Node's fetch
    // rejects a streaming request body without `duplex`, which the SDK does
    // not set. Course assets are single-request sized, so the simple upload is
    // the right one anyway.
    await this.#bucket.file(objectPath).save(Buffer.from(body), { resumable: false });
  }

  async remove(objectPath: string): Promise<void> {
    assertSafeKey(objectPath);
    await this.#bucket.file(objectPath).delete({ ignoreNotFound: true });
  }

  async #download(objectPath: string): Promise<Buffer> {
    try {
      const [body] = await this.#bucket.file(objectPath).download();
      return body;
    } catch {
      throw new InvalidBlobKeyError(objectPath, "not-found");
    }
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
