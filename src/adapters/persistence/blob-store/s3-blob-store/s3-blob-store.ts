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

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Everything the driver needs to talk to one bucket. */
export type S3BlobStoreConfig = {
  bucket: string;
  region: string;
  /** Custom endpoint for S3-compatible stores (R2, MinIO, LocalStack). */
  endpoint?: string;
  /** Path-style addressing, which most S3-compatible stores require. */
  forcePathStyle?: boolean;
  /** Public URL prefix, usually a CDN. Absent for a private bucket. */
  publicUrl?: string;
};

/**
 * Driven adapter: S3-backed `BlobStore`.
 *
 * @remarks
 * Resolves an object path within ONE bucket. It knows nothing about content
 * keys or routing — `RoutingBlobStore` decides which store owns a key and
 * composes the object path before delegating here, so prefix composition lives
 * in one place rather than being repeated across drivers.
 *
 * A private bucket has no `publicUrl`, and {@link S3BlobStore.url} refuses
 * rather than inventing one; such stores are reached through the signing
 * endpoint, which calls {@link S3BlobStore.signedUrl}.
 *
 * Credentials come from the ambient AWS credential chain (environment,
 * profile, instance role) — never from the location manifest, which is
 * tracked in git.
 *
 * @category Adapters
 */
export class S3BlobStore implements BlobStore, SignedUrlSource, TransferableBlobStore {
  readonly #client: S3Client;
  readonly #bucket: string;
  readonly #publicUrl: string | undefined;

  constructor(config: S3BlobStoreConfig) {
    this.#bucket = config.bucket;
    this.#publicUrl = config.publicUrl ? stripTrailingSlash(config.publicUrl) : undefined;
    this.#client = new S3Client({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      ...(config.forcePathStyle ? { forcePathStyle: true } : {}),
    });
  }

  url(objectPath: string): string {
    assertSafeKey(objectPath);
    if (!this.#publicUrl) {
      throw new Error(
        `S3 bucket "${this.#bucket}" declares no publicUrl; private objects are served through the signing endpoint`,
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
      await this.#client.send(new HeadObjectCommand({ Bucket: this.#bucket, Key: objectPath }));
      return true;
    } catch {
      return false;
    }
  }

  async readText(objectPath: string): Promise<string> {
    assertSafeKey(objectPath);
    assertTextKey(objectPath);

    const body = await this.#getObjectBody(objectPath);
    if (body.byteLength > MAX_TEXT_BYTES) {
      throw new InvalidBlobKeyError(objectPath, "too-large");
    }
    return Buffer.from(body).toString("utf8");
  }

  async signedUrl(objectPath: string, ttlSeconds: number): Promise<string> {
    assertSafeKey(objectPath);
    return getSignedUrl(
      this.#client,
      new GetObjectCommand({ Bucket: this.#bucket, Key: objectPath }),
      { expiresIn: ttlSeconds },
    );
  }

  async readBytes(objectPath: string): Promise<Uint8Array> {
    assertSafeKey(objectPath);
    return this.#getObjectBody(objectPath);
  }

  async write(objectPath: string, body: Uint8Array): Promise<void> {
    assertSafeKey(objectPath);
    await this.#client.send(
      new PutObjectCommand({ Bucket: this.#bucket, Key: objectPath, Body: body }),
    );
  }

  async remove(objectPath: string): Promise<void> {
    assertSafeKey(objectPath);
    await this.#client.send(new DeleteObjectCommand({ Bucket: this.#bucket, Key: objectPath }));
  }

  async #getObjectBody(objectPath: string): Promise<Uint8Array> {
    try {
      const response = await this.#client.send(
        new GetObjectCommand({ Bucket: this.#bucket, Key: objectPath }),
      );
      return await (
        response.Body as { transformToByteArray(): Promise<Uint8Array> }
      ).transformToByteArray();
    } catch {
      throw new InvalidBlobKeyError(objectPath, "not-found");
    }
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
