import { access } from "node:fs/promises";
import path from "node:path";

import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";

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
export class LocalFilesystemBlobStore implements BlobStore {
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
      await access(path.join(this.#localRoot, key));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Strips a single trailing slash so concatenation in `url()` never produces
 * `//`. Leading slashes are preserved (the caller decides whether the URL
 * is site-relative or absolute).
 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
