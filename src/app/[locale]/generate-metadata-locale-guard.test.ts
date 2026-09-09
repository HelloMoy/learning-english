import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { notFound } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  };
});

const mockNotFound = vi.mocked(notFound);

// The layout imports `Geist` and `Geist_Mono` as *named* exports at module
// scope. The global `next/font/google` mock is a Proxy serving any font name
// through `get`, which Vite's named-export validation cannot see — it reports
// the module as exporting nothing and the import fails before `get` is ever
// called. Naming the two fonts this route actually uses is enough here, and
// leaves the shared Proxy mock — which every other test relies on — alone.
vi.mock("next/font/google", () => {
  const mockFont = (name: string) => () => ({
    className: `mocked-${name}`,
    variable: `--mocked-${name}`,
    style: { fontFamily: `mocked-${name}` },
  });
  return { Geist: mockFont("geist"), Geist_Mono: mockFont("geist-mono") };
});

const LOCALE_SEGMENT_ROOT = join(process.cwd(), "src/app/[locale]");

/**
 * Every route file under `[locale]` that declares `generateMetadata`.
 *
 * @remarks
 * Discovered from disk rather than listed, so a route added later is covered
 * the moment it exists. That is the whole point: the guard is one line, and a
 * missing line is exactly the kind of omission a review waves through.
 */
function routesDeclaringMetadata(directory: string = LOCALE_SEGMENT_ROOT): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...routesDeclaringMetadata(path));
      continue;
    }
    if (entry.name !== "page.tsx" && entry.name !== "layout.tsx") continue;
    if (readFileSync(path, "utf8").includes("export async function generateMetadata")) {
      found.push(path);
    }
  }
  return found.sort();
}

/**
 * Route params generous enough for any route under `[locale]`. The guard runs
 * before anything reads the rest, so their values never matter.
 */
const paramsFor = (locale: string) => ({
  params: Promise.resolve({
    locale,
    courseSlug: "basic-course",
    moduleSlug: "1-introduction",
    lessonId: "0b06e639-efda-596d-8676-1e6e33410803",
  }),
});

type MetadataRoute = {
  generateMetadata?: (props: ReturnType<typeof paramsFor>) => Promise<unknown>;
};

beforeEach(() => {
  mockNotFound.mockClear();
});

describe("generateMetadata under [locale]", () => {
  const routes = routesDeclaringMetadata();

  test("WHEN the route tree is scanned THEN every known metadata route is found", () => {
    // A guard against the scan silently matching nothing — which would make
    // every assertion below pass for the wrong reason.
    expect(routes.length).toBeGreaterThanOrEqual(5);
  });

  test.each(routes.map((path) => [relative(process.cwd(), path), path] as const))(
    "WHEN %s builds metadata for an unsupported locale THEN the request is not found",
    async (_label, path) => {
      const route: MetadataRoute = await import(/* @vite-ignore */ path);

      // The proxy matcher excludes dotted paths, so `/manifest.json` reaches
      // the router with that as its locale. Reaching a metadata builder with
      // it is what used to throw and litter the server log.
      await expect(route.generateMetadata?.(paramsFor("manifest.json"))).rejects.toThrow();

      expect(mockNotFound).toHaveBeenCalled();
    },
  );

  test.each(routes.map((path) => [relative(process.cwd(), path), path] as const))(
    "WHEN %s builds metadata for a supported locale THEN it is not turned away",
    async (_label, path) => {
      const route: MetadataRoute = await import(/* @vite-ignore */ path);

      await route.generateMetadata?.(paramsFor("en")).catch(() => {
        // A route may still fail for its own reasons — an unresolvable course
        // slug, say. Only the locale guard is under test here.
      });

      expect(mockNotFound).not.toHaveBeenCalled();
    },
  );
});
