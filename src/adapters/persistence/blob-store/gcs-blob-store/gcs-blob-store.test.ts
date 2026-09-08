import { execSync } from "node:child_process";

import { InvalidBlobKeyError } from "@/adapters/persistence/blob-store/blob-key/blob-key";

import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { GcsBlobStore } from "./gcs-blob-store";

/**
 * Drives a REAL GCS API (`fake-gcs-server` in a container) rather than a
 * mocked SDK, for the same reason the S3 suite does: prefix composition and
 * missing-object reporting are exactly what a mock cannot verify. Gated on
 * Docker, mirroring the ffmpeg gate on the seed generator's suite.
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
const GCS_PORT = 4443;
const CONTAINER_BOOT_MS = 180_000;

describe.skipIf(!DOCKER_AVAILABLE)("GcsBlobStore (integration)", () => {
  let container: StartedTestContainer;
  let store: GcsBlobStore;
  let publicStore: GcsBlobStore;

  beforeAll(async () => {
    container = await new GenericContainer("fsouza/fake-gcs-server:1.49")
      .withExposedPorts(GCS_PORT)
      .withCommand(["-scheme", "http", "-port", String(GCS_PORT), "-backend", "memory"])
      .withWaitStrategy(Wait.forListeningPorts())
      .start();
    const apiEndpoint = `http://${container.getHost()}:${container.getMappedPort(GCS_PORT)}`;

    // Seed the bucket through the emulator's own REST API — the SDK's upload
    // path is not what these tests are about.
    await fetch(`${apiEndpoint}/storage/v1/b?project=test`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: BUCKET }),
    });
    await putObject(apiEndpoint, "course/lesson/video.mp4", "video-bytes");
    await putObject(apiEndpoint, "course/lesson/readme.md", "# Notes");
    await putObject(apiEndpoint, "v1/course/lesson/video.mp4", "v1-bytes");

    store = new GcsBlobStore({ bucket: BUCKET, apiEndpoint });
    publicStore = new GcsBlobStore({
      bucket: BUCKET,
      apiEndpoint,
      publicUrl: "https://cdn.example.com/docs",
    });
  }, CONTAINER_BOOT_MS);

  afterAll(async () => {
    await container?.stop();
  });

  async function putObject(apiEndpoint: string, name: string, body: string): Promise<void> {
    const url = `${apiEndpoint}/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(name)}`;
    const response = await fetch(url, { method: "POST", body });
    if (!response.ok) throw new Error(`seeding ${name} failed: ${response.status}`);
  }

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
    expect(publicStore.url("course/lesson/video.mp4")).toBe(
      "https://cdn.example.com/docs/course/lesson/video.mp4",
    );
  });

  test("WHEN the store has no publicUrl THEN url() refuses instead of guessing", () => {
    expect(() => store.url("course/lesson/video.mp4")).toThrow(/publicUrl/);
  });

  test("WHEN the caller passes a prefixed object path THEN that object is read", async () => {
    await expect(store.exists("v1/course/lesson/video.mp4")).resolves.toBe(true);
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
      await store.write("moved/lesson/video.mp4", new TextEncoder().encode("moved-bytes"));

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
