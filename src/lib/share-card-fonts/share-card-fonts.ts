import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The two Geist weights the sharing card renders in, as `ImageResponse` wants
 * them.
 *
 * @remarks
 * `ImageResponse` runs Satori, not a browser: it takes fonts as raw buffers and
 * accepts `ttf`, `otf` and `woff` — but not `woff2`, which is the only format
 * `next/font/google` caches. So the two weights are vendored under
 * `src/app/fonts/` rather than shared with the rest of the app's typography.
 * See the README beside them.
 *
 * Read once per process and reused. Every card render would otherwise re-read
 * 70 KB from disk for a result that never changes.
 *
 * @returns The font descriptors, ready to hand to `ImageResponse`
 * @category Metadata
 */
export async function shareCardFonts() {
  loaded ??= load();
  return loaded;
}

let loaded: ReturnType<typeof load> | null = null;

async function load() {
  const directory = join(process.cwd(), "src", "app", "fonts");
  const [regular, extraBold] = await Promise.all([
    readFile(join(directory, "Geist-Regular.woff")),
    readFile(join(directory, "Geist-ExtraBold.woff")),
  ]);

  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: extraBold, weight: 800 as const, style: "normal" as const },
  ];
}
