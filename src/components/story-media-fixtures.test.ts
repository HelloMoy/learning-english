import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

/**
 * Paths a story references on purpose without a file behind them, because the
 * story exists to show what happens when the media never arrives.
 */
const DELIBERATELY_MISSING: ReadonlyArray<string> = [
  // LessonView/VideoBufferingIndicator "Buffering" — the 404 is the story.
  "/videos/a-lesson-that-never-arrives.mp4",
];

const MEDIA_REFERENCE = /["'](\/(?:videos|thumbnails)\/[^"']+)["']/g;

const COMPONENTS_DIR = join(process.cwd(), "src", "components");

function storyFilePaths(): ReadonlyArray<string> {
  return readdirSync(COMPONENTS_DIR, { recursive: true, encoding: "utf8" })
    .filter((entry) => entry.endsWith(".stories.tsx"))
    .map((entry) => join("src", "components", entry));
}

/** Every `/videos/…` and `/thumbnails/…` path a story file names, once each. */
function mediaReferencedByStories(): ReadonlyArray<{ path: string; storyFile: string }> {
  const references = storyFilePaths().flatMap((storyFile) =>
    [...readFileSync(join(process.cwd(), storyFile), "utf8").matchAll(MEDIA_REFERENCE)].map(
      ([, path]) => ({ path, storyFile }),
    ),
  );

  return references.filter(
    ({ path }, index) =>
      !DELIBERATELY_MISSING.includes(path) &&
      references.findIndex((other) => other.path === path) === index,
  );
}

describe("media fixtures referenced by stories", () => {
  const referenced = mediaReferencedByStories();

  test("WHEN stories are read THEN at least one fixture is referenced", () => {
    expect(referenced.length).toBeGreaterThan(0);
  });

  test.each(referenced)("WHEN $storyFile names $path THEN the file has content", ({ path }) => {
    const onDisk = join(process.cwd(), "public", path);

    expect(statSync(onDisk, { throwIfNoEntry: false })?.size ?? 0).toBeGreaterThan(0);
  });
});
