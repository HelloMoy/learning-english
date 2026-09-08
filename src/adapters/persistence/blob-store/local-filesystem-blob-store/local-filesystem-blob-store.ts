import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  assertSafeKey,
  assertTextKey,
  InvalidBlobKeyError,
  MAX_TEXT_BYTES,
} from "@/adapters/persistence/blob-store/blob-key/blob-key";
import type {
  BlobStore,
  TransferableBlobStore,
} from "@/adapters/persistence/blob-store/blob-store";

export { InvalidBlobKeyError } from "@/adapters/persistence/blob-store/blob-key/blob-key";

/**
 * Driven adapter: filesystem-backed `BlobStore`.
 *
 * Resolves a content `key` (e.g., `advanced-intermediate-course/.../lesson.mp4`)
 * to a URL served by Next.js from `/public/`, AND checks whether the
 * underlying file exists on disk.
 *
 * The constructor takes TWO separate arguments on purpose — mixing the URL
 * prefix with the filesystem path is a footgun. `baseUrl` is the public
 * URL prefix (no trailing slash), `localRoot` is the absolute filesystem
 * path the content lives under. They MUST be passed explicitly; the
 * constructor does not derive one from the other.
 *
 * Migration story: a future `S3BlobStore` will replace this implementation
 * without changes to the lesson/resource adapters. The constructor shape
 * (separating "what the URL looks like" from "where the bytes live") is
 * the contract the S3 driver will mirror with `{ bucket, region, cdnUrl? }`.
 */
export class LocalFilesystemBlobStore implements BlobStore, TransferableBlobStore {
  readonly #baseUrl: string;
  readonly #localRoot: string;

  constructor({ baseUrl, localRoot }: { baseUrl: string; localRoot: string }) {
    this.#baseUrl = normalizeBaseUrl(baseUrl);
    this.#localRoot = localRoot;
  }

  url(key: string): string {
    return `${this.#baseUrl}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      assertSafeKey(key);
    } catch {
      return false;
    }
    try {
      await access(path.join(this.#localRoot, key));
      return true;
    } catch {
      return false;
    }
  }

  async readText(key: string): Promise<string> {
    assertSafeKey(key);
    assertTextKey(key);
    const absolute = path.join(this.#localRoot, key);
    try {
      await access(absolute);
    } catch {
      throw new InvalidBlobKeyError(key, "not-found");
    }
    const buf = await readFile(absolute);
    if (buf.byteLength > MAX_TEXT_BYTES) {
      throw new InvalidBlobKeyError(key, "too-large");
    }
    return buf.toString("utf8");
  }

  async readBytes(key: string): Promise<Uint8Array> {
    assertSafeKey(key);
    const absolute = path.join(this.#localRoot, key);
    try {
      return await readFile(absolute);
    } catch {
      throw new InvalidBlobKeyError(key, "not-found");
    }
  }

  async write(key: string, body: Uint8Array): Promise<void> {
    assertSafeKey(key);
    const absolute = path.join(this.#localRoot, key);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, body);
  }

  async remove(key: string): Promise<void> {
    assertSafeKey(key);
    await rm(path.join(this.#localRoot, key), { force: true });
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
