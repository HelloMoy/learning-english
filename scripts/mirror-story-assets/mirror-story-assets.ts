import { cpSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * The `public/` folders stories address from the domain root. On the portal,
 * Storybook lives under `/storybook/`, so these are mirrored to the site root
 * for those root-relative paths to resolve.
 */
export const STORY_ASSET_FOLDERS: ReadonlyArray<string> = [
  "videos",
  "thumbnails",
  "local-filesystem-lesson",
];

/**
 * Copies each story media folder from the site's Storybook build to the site
 * root.
 *
 * @param siteDir - The assembled portal, `docs-portal/dist/`
 * @throws When the Storybook build lacks one of the folders: `public/` has
 *   changed, and the list needs a look
 */
export function mirrorStoryAssets(siteDir: string): void {
  for (const folder of STORY_ASSET_FOLDERS) {
    const source = path.join(siteDir, "storybook", folder);
    if (!existsSync(source)) {
      throw new Error(`The Storybook build has no ${folder}/ to mirror (looked in ${source})`);
    }
    cpSync(source, path.join(siteDir, folder), { recursive: true });
  }
}

function main(): void {
  const siteDir = path.resolve(import.meta.dirname, "../../docs-portal/dist");

  mirrorStoryAssets(siteDir);
  console.log(`Mirrored ${STORY_ASSET_FOLDERS.join(", ")} to the root of ${siteDir}`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main();
}
