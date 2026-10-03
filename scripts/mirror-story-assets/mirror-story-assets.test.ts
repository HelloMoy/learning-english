// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { mirrorStoryAssets, STORY_ASSET_FOLDERS } from "./mirror-story-assets";

/**
 * Guards the `docs-portal` requirement that media addressed by stories loads
 * on the published Storybook, which lives under `/storybook/` while stories
 * name the app's public files from the domain root.
 */

/** An assembled site whose Storybook build holds one file per given folder. */
function siteWithStorybookFolders(folders: ReadonlyArray<string>): string {
  const siteDir = mkdtempSync(path.join(tmpdir(), "story-assets-"));
  for (const folder of folders) {
    mkdirSync(path.join(siteDir, "storybook", folder, "nested"), { recursive: true });
    writeFileSync(path.join(siteDir, "storybook", folder, "nested", "file.bin"), folder);
  }
  return siteDir;
}

describe("mirrorStoryAssets", () => {
  test("copies each story media folder from the Storybook build to the site root", () => {
    const siteDir = siteWithStorybookFolders(STORY_ASSET_FOLDERS);

    mirrorStoryAssets(siteDir);

    for (const folder of STORY_ASSET_FOLDERS) {
      expect(readFileSync(path.join(siteDir, folder, "nested", "file.bin"), "utf8")).toBe(folder);
    }
  });

  test("fails naming a folder the Storybook build does not have", () => {
    const siteDir = siteWithStorybookFolders(["videos", "thumbnails"]);

    expect(() => mirrorStoryAssets(siteDir)).toThrow(/local-filesystem-lesson/);
  });
});

const ROOT = path.resolve(__dirname, "../..");
const PUBLIC_ENTRIES = new Set(readdirSync(path.join(ROOT, "public")));
const ROOT_RELATIVE_LITERAL = /["'`](\/[^"'`\s]*)["'`]/g;

function storyFiles(): string[] {
  return readdirSync(path.join(ROOT, "src"), { recursive: true, encoding: "utf8" })
    .filter((file) => /\.stories\.tsx$|\.mdx$/.test(file))
    .map((file) => path.join("src", file));
}

/** Root-relative paths into `public/` that a story's source names outside the mirrored folders. */
function unmirroredPublicPaths(source: string): string[] {
  return [...source.matchAll(ROOT_RELATIVE_LITERAL)]
    .map(([, literal]) => literal)
    .filter((literal) => {
      const [, entry] = literal.split("/");
      return PUBLIC_ENTRIES.has(entry) && !STORY_ASSET_FOLDERS.includes(entry);
    });
}

describe("public files named by stories", () => {
  test("a folder the portal does not mirror is caught, a route is not", () => {
    const source = `args: { audio: "/audio/intro.mp3", href: "/en/learning", poster: "/videos/a.mp4" }`;

    expect(unmirroredPublicPaths(source)).toEqual(["/audio/intro.mp3"]);
  });

  test("all sit in a folder the portal mirrors", () => {
    const offenders = storyFiles().flatMap((storyFile) =>
      unmirroredPublicPaths(readFileSync(path.join(ROOT, storyFile), "utf8")).map(
        (literal) => `${storyFile}: ${literal}`,
      ),
    );

    expect(offenders).toEqual([]);
  });
});
