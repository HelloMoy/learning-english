import { parseContentLocations } from "@/adapters/persistence/blob-store/content-locations/content-locations";
import { RoutingBlobStore } from "@/adapters/persistence/blob-store/routing-blob-store/routing-blob-store";

import { describe, expect, test } from "vitest";

import { contentRedirect } from "./content-redirect";

/** A driver that signs, and records whether any body was ever read. */
function fakeDriver(options: { exists?: boolean } = {}) {
  const reads: string[] = [];
  return {
    reads,
    driver: {
      url: (objectPath: string) => `https://public.example.com/${objectPath}`,
      exists: async () => options.exists ?? true,
      readText: async (objectPath: string) => {
        reads.push(objectPath);
        return "body";
      },
      signedUrl: async (objectPath: string, ttl: number) =>
        `https://bucket.example.com/${objectPath}?X-Amz-Expires=${ttl}`,
    },
  };
}

function storeWith(doc: Record<string, unknown>, driver: unknown, name: string): RoutingBlobStore {
  return new RoutingBlobStore({
    manifest: parseContentLocations(JSON.stringify({ version: 1, ...doc })),
    drivers: { [name]: driver as never },
  });
}

const PRIVATE_MANIFEST = {
  stores: { private: { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1/" } },
  default: "private",
};

describe("contentRedirect", () => {
  test("WHEN the key routes to a signed store THEN it answers 302 with a signed Location", async () => {
    const blobStore = storeWith(PRIVATE_MANIFEST, fakeDriver().driver, "private");

    const response = await contentRedirect("course/1-intro/video.mp4", blobStore);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://bucket.example.com/v1/course/1-intro/video.mp4?X-Amz-Expires=21600",
    );
  });

  test("WHEN it redirects THEN it streams no bytes of its own", async () => {
    const fake = fakeDriver();
    const blobStore = storeWith(PRIVATE_MANIFEST, fake.driver, "private");

    const response = await contentRedirect("course/1-intro/video.mp4", blobStore);

    expect(await response.text()).toBe("");
    expect(fake.reads).toHaveLength(0);
  });

  test("WHEN the object is missing THEN it answers 404", async () => {
    const blobStore = storeWith(PRIVATE_MANIFEST, fakeDriver({ exists: false }).driver, "private");

    const response = await contentRedirect("course/1-intro/absent.mp4", blobStore);

    expect(response.status).toBe(404);
  });

  test("WHEN the key traverses upward THEN it answers 400 before any store call", async () => {
    const fake = fakeDriver();
    const blobStore = storeWith(PRIVATE_MANIFEST, fake.driver, "private");

    const response = await contentRedirect("../../etc/passwd", blobStore);

    expect(response.status).toBe(400);
    expect(fake.reads).toHaveLength(0);
  });

  test("WHEN the key is absolute THEN it answers 400", async () => {
    const blobStore = storeWith(PRIVATE_MANIFEST, fakeDriver().driver, "private");

    const response = await contentRedirect("/etc/passwd", blobStore);

    expect(response.status).toBe(400);
  });

  test("WHEN the key routes to a public store THEN it redirects to the permanent URL", async () => {
    // A link minted while the store was private must keep working after it is
    // opened up, rather than 404ing.
    const blobStore = storeWith(
      { stores: { local: { driver: "local" } }, default: "local" },
      fakeDriver().driver,
      "local",
    );

    const response = await contentRedirect("course/1-intro/video.mp4", blobStore);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://public.example.com/course/1-intro/video.mp4",
    );
  });
});
