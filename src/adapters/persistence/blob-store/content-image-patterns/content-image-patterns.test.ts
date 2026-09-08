import { parseContentLocations } from "@/adapters/persistence/blob-store/content-locations/content-locations";

import { describe, expect, test } from "vitest";

import { contentImageRemotePatterns } from "./content-image-patterns";

function manifest(doc: Record<string, unknown>) {
  return parseContentLocations(JSON.stringify({ version: 1, ...doc }));
}

describe("contentImageRemotePatterns", () => {
  test("WHEN there is no manifest THEN no remote pattern is produced", () => {
    expect(contentImageRemotePatterns(null)).toEqual([]);
  });

  test("WHEN the only store is local and site-relative THEN no remote pattern is produced", () => {
    const patterns = contentImageRemotePatterns(
      manifest({ stores: { local: { driver: "local" } }, default: "local" }),
    );

    expect(patterns).toEqual([]);
  });

  test("WHEN a public store has an https URL THEN one pattern is produced for it", () => {
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: {
          "s3-video": {
            driver: "s3",
            bucket: "b",
            region: "r",
            visibility: "public",
            publicUrl: "https://cdn.example.com/course-content",
          },
        },
        default: "s3-video",
      }),
    );

    expect(patterns).toEqual([
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/course-content/**",
      },
    ]);
  });

  test("WHEN two public stores sit on different hosts THEN each contributes a pattern", () => {
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: {
          a: {
            driver: "s3",
            bucket: "b",
            region: "r",
            visibility: "public",
            publicUrl: "https://one.example.com/a",
          },
          b: {
            driver: "gcs",
            bucket: "c",
            visibility: "public",
            publicUrl: "https://two.example.com/b",
          },
        },
        default: "a",
      }),
    );

    expect(patterns.map((pattern) => pattern.hostname).sort()).toEqual([
      "one.example.com",
      "two.example.com",
    ]);
  });

  test("WHEN a store is signed THEN it contributes no pattern", () => {
    // Its posters are fetched from the app's own origin through /api/content.
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: { private: { driver: "s3", bucket: "b", region: "r" } },
        default: "private",
      }),
    );

    expect(patterns).toEqual([]);
  });

  test("WHEN a local store points at a CDN THEN it contributes a pattern too", () => {
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: { local: { driver: "local", baseUrl: "https://cdn.example.com/content" } },
        default: "local",
      }),
    );

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({ hostname: "cdn.example.com", pathname: "/content/**" });
  });

  test("WHEN a public URL carries a port THEN the pattern keeps it", () => {
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: { local: { driver: "local", baseUrl: "http://localhost:9000/content" } },
        default: "local",
      }),
    );

    expect(patterns[0]).toMatchObject({ protocol: "http", port: "9000" });
  });

  test("WHEN a public URL is not http(s) THEN it is ignored rather than allowlisted", () => {
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: {
          local: { driver: "local" },
          weird: {
            driver: "s3",
            bucket: "b",
            region: "r",
            visibility: "public",
            publicUrl: "ftp://files.example.com/content",
          },
        },
        default: "local",
      }),
    );

    expect(patterns).toEqual([]);
  });

  test("WHEN the same host serves two stores THEN each path is scoped separately", () => {
    // Scoping to the path prefix keeps this from quietly becoming "any image
    // from that domain".
    const patterns = contentImageRemotePatterns(
      manifest({
        stores: {
          a: {
            driver: "s3",
            bucket: "b",
            region: "r",
            visibility: "public",
            publicUrl: "https://cdn.example.com/video",
          },
          b: {
            driver: "s3",
            bucket: "c",
            region: "r",
            visibility: "public",
            publicUrl: "https://cdn.example.com/docs",
          },
        },
        default: "a",
      }),
    );

    expect(patterns.map((pattern) => pattern.pathname).sort()).toEqual(["/docs/**", "/video/**"]);
  });
});
