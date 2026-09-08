import { execSync } from "node:child_process";

import { InvalidBlobKeyError } from "@/adapters/persistence/blob-store/blob-key/blob-key";

import { CreateBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { LocalstackContainer, type StartedLocalStackContainer } from "@testcontainers/localstack";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { S3BlobStore } from "./s3-blob-store";

/**
 * These suites drive a REAL S3 API (LocalStack in a container) rather than a
 * mocked SDK, because a mock cannot catch the things that actually break a
 * storage adapter: path-style addressing, prefix composition, and how a
 * missing object is reported. Gated on Docker the same way the seed
 * generator's suite is gated on ffmpeg, so a laptop without Docker still runs
 * `pnpm test:run`.
 */
const DOCKER_AVAILABLE = (() => {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const BUCKET = "lessons-test";

function restoreEnv(name: string, original: string | undefined): void {
  if (original === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = original;
  }
}
const CONTAINER_BOOT_MS = 180_000;

describe.skipIf(!DOCKER_AVAILABLE)("S3BlobStore (integration)", () => {
  let container: StartedLocalStackContainer;
  let store: S3BlobStore;
  let prefixedStore: S3BlobStore;
  const originalCredentials = {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
  };

  beforeAll(async () => {
    container = await new LocalstackContainer("localstack/localstack:3").start();
    const endpoint = container.getConnectionUri();
    // The driver reads the ambient AWS credential chain on purpose — secrets
    // never live in the location manifest — so the test supplies them the same
    // way a deployment would.
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
    const credentials = { accessKeyId: "test", secretAccessKey: "test" };
    const client = new S3Client({
      region: "us-east-1",
      endpoint,
      forcePathStyle: true,
      credentials,
    });
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    await client.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: "course/lesson/video.mp4", Body: "video-bytes" }),
    );
    await client.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: "course/lesson/readme.md", Body: "# Notes" }),
    );
    await client.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: "v1/course/lesson/video.mp4", Body: "v1-bytes" }),
    );

    const common = { bucket: BUCKET, region: "us-east-1", endpoint, forcePathStyle: true };
    store = new S3BlobStore({ ...common, publicUrl: "https://cdn.example.com/video" });
    prefixedStore = new S3BlobStore(common);
  }, CONTAINER_BOOT_MS);

  afterAll(async () => {
    restoreEnv("AWS_ACCESS_KEY_ID", originalCredentials.key);
    restoreEnv("AWS_SECRET_ACCESS_KEY", originalCredentials.secret);
    await container?.stop();
  });

  test("WHEN the object exists THEN exists() is true", async () => {
    await expect(store.exists("course/lesson/video.mp4")).resolves.toBe(true);
  });

  test("WHEN the object is absent THEN exists() is false", async () => {
    await expect(store.exists("course/lesson/absent.mp4")).resolves.toBe(false);
  });

  test("WHEN a text object is read THEN its body comes back decoded", async () => {
    await expect(store.readText("course/lesson/readme.md")).resolves.toBe("# Notes");
  });

  test("WHEN the store is public THEN url() is the publicUrl plus the object path", () => {
    expect(store.url("course/lesson/video.mp4")).toBe(
      "https://cdn.example.com/video/course/lesson/video.mp4",
    );
  });

  test("WHEN the store has no publicUrl THEN url() refuses instead of guessing", () => {
    expect(() => prefixedStore.url("course/lesson/video.mp4")).toThrow(/publicUrl/);
  });

  test("WHEN a signed URL is minted THEN it fetches the object without credentials", async () => {
    const signed = await store.signedUrl("course/lesson/video.mp4", 3600);

    const response = await fetch(signed);

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("video-bytes");
  });

  test("WHEN a TTL is requested THEN the signature carries it", async () => {
    // Asserting on the signature rather than on expiry enforcement: LocalStack
    // does not reject expired presigned URLs, so a "wait and re-fetch" test
    // would pass against a driver that ignored the TTL entirely.
    const signed = await store.signedUrl("course/lesson/video.mp4", 900);

    expect(new URL(signed).searchParams.get("X-Amz-Expires")).toBe("900");
  });

  test("WHEN the caller passes a prefixed object path THEN that object is read", async () => {
    // The routing store composes the prefix; the driver just resolves a path.
    await expect(prefixedStore.exists("v1/course/lesson/video.mp4")).resolves.toBe(true);
  });

  describe("key safety", () => {
    test("WHEN the path traverses upward THEN readText rejects before any request", async () => {
      await expect(store.readText("../../etc/passwd")).rejects.toBeInstanceOf(InvalidBlobKeyError);
    });

    test("WHEN the path is absolute THEN readText rejects", async () => {
      await expect(store.readText("/etc/passwd")).rejects.toBeInstanceOf(InvalidBlobKeyError);
    });

    test("WHEN the path names a binary asset THEN readText refuses to decode it", async () => {
      await expect(store.readText("course/lesson/video.mp4")).rejects.toBeInstanceOf(
        InvalidBlobKeyError,
      );
    });

    test("WHEN the path is unsafe THEN exists() answers false rather than throwing", async () => {
      await expect(store.exists("../../etc/passwd")).resolves.toBe(false);
    });

    test("WHEN a text object is missing THEN readText rejects as not-found", async () => {
      await expect(store.readText("course/lesson/absent.md")).rejects.toMatchObject({
        reason: "not-found",
      });
    });
  });

  describe("transfer", () => {
    test("WHEN bytes are written THEN they can be read back verbatim", async () => {
      const body = new TextEncoder().encode("moved-bytes");

      await store.write("moved/lesson/video.mp4", body);

      expect(await store.exists("moved/lesson/video.mp4")).toBe(true);
      expect(Buffer.from(await store.readBytes("moved/lesson/video.mp4")).toString()).toBe(
        "moved-bytes",
      );
    });

    test("WHEN an object is removed THEN it no longer exists", async () => {
      await store.write("removable/lesson/video.mp4", new TextEncoder().encode("x"));

      await store.remove("removable/lesson/video.mp4");

      expect(await store.exists("removable/lesson/video.mp4")).toBe(false);
    });

    test("WHEN reading bytes of a missing object THEN it rejects as not-found", async () => {
      await expect(store.readBytes("absent/lesson/video.mp4")).rejects.toMatchObject({
        reason: "not-found",
      });
    });
  });
});
