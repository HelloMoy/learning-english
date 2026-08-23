import { access, readFile } from "node:fs/promises";
import path from "node:path";

import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";

/**
 * The only file extensions `readText` is allowed to interpret as UTF-8
 * text. The current corpus is Markdown only. Binary resources must NOT
 * be decoded as text.
 */
const TEXT_EXTENSIONS = new Set([".md"]);

/**
 * Maximum size in bytes that `readText` will decode. Markdown notes in the
 * current corpus are well under 16 KiB; 1 MiB is a generous safety cap that
 * still prevents accidental binary reads from being materialised as
 * potentially-huge strings in memory.
 */
const MAX_TEXT_BYTES = 1024 * 1024;

export class InvalidBlobKeyError extends Error {
  readonly key: string;
  readonly reason: "traversal" | "absolute" | "binary" | "too-large" | "not-found";
  constructor(key: string, reason: InvalidBlobKeyError["reason"]) {
    super(`Invalid blob key ${JSON.stringify(key)}: ${reason}`);
    this.name = "InvalidBlobKeyError";
    this.key = key;
    this.reason = reason;
  }
}

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
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function assertSafeKey(key: string): void {
  if (!key || key.length === 0) {
    throw new InvalidBlobKeyError(key, "absolute");
  }
  // Reject absolute paths and protocol-relative URLs before any FS access.
  if (key.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(key) || key.startsWith("\\")) {
    throw new InvalidBlobKeyError(key, "absolute");
  }
  // Reject path traversal after normalising separators.
  const segments = key.split(/[\\/]+/);
  if (segments.some((segment) => segment === ".." || segment === "")) {
    throw new InvalidBlobKeyError(key, "traversal");
  }
}

function assertTextKey(key: string): void {
  const lower = key.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  if (!TEXT_EXTENSIONS.has(ext)) {
    throw new InvalidBlobKeyError(key, "binary");
  }
}
