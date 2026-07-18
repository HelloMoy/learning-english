/**
 * Smoke runner: regenerates `seed-content.ts` against the real
 * `public/local-filesystem-lesson/` directory. Run via:
 *
 *   pnpm vitest run scripts/regenerate-content-seed.test.ts
 *
 * This file is the de-facto CLI entry point for the generator when no
 * `tsx` is installed in the project (Node's bare `--experimental-strip-types`
 * hits a zod 4 condition mismatch). Vitest's runtime handles TS + the
 * `@/...` aliases natively.
 *
 * Marked `.test.ts` so vitest picks it up and so the integration suite
 * in `generate-course-content-seed.test.ts` keeps using the small
 * synthetic fixture. The two never run together unintentionally because
 * this test only triggers when the real content folder is present.
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { runGenerator } from "./generate-course-content-seed";

const REAL_CONTENT = path.resolve(
  process.cwd(),
  "public/local-filesystem-lesson/advanced-intermediate-course",
);

describe.skipIf(!existsSync(REAL_CONTENT))("regenerate content seed (smoke)", () => {
  test("generates seed-content.ts against the real 15 GB content folder", async () => {
    // Act — produces `src/adapters/persistence/in-memory/seed/seed-content.ts`.
    await runGenerator({
      sourceDir: "public/local-filesystem-lesson",
      outFile: "src/adapters/persistence/in-memory/seed/seed-content.ts",
    });

    // Assert — the file was written.
    expect(existsSync("src/adapters/persistence/in-memory/seed/seed-content.ts")).toBe(true);
  }, 600_000);
});
