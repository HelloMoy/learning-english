// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { SERVER_ENV_VARIABLES } from "@/lib/server-env/server-env";

import { describe, expect, test } from "vitest";

/**
 * Guards the `production-deployment` capability's repository contracts: the
 * build that migrates first, CI running the images development runs, and a
 * runbook that names every variable the server reads.
 */

const ROOT = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

// Both files declare each container on one `image:` line; matching those
// lines spares a YAML parser dependency for one assertion.
const imagesIn = (file: string) =>
  [...read(file).matchAll(/^\s*image:\s*["']?([^"'\s]+)/gm)].map((match) => match[1]).sort();

describe("the vercel-build script", () => {
  test("migrates the database, and builds only if that succeeded", () => {
    const { scripts } = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

    expect(scripts["vercel-build"]).toBe("drizzle-kit migrate && next build");
  });
});

describe("the CI workflow", () => {
  test("runs the same service images compose.yaml pins", () => {
    expect(imagesIn(".github/workflows/ci.yml")).toEqual(imagesIn("compose.yaml"));
  });
});

describe("DEPLOYMENT.md", () => {
  test.each([...SERVER_ENV_VARIABLES])("documents %s", (name) => {
    expect(read("DEPLOYMENT.md")).toContain(name);
  });
});
