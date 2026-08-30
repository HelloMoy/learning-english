import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { normalizeFileName } from "./resolve-slug";

/**
 * Classification of a lesson folder's contents into a structured shape the
 * seed generator can consume.
 *
 * Rules (per the `course-content-storage` spec):
 *  - If the folder contains an `.mp4`, the lesson is `video`. Its `source`
 *    URL points to the mp4. The first image (`.jpg`/`.jpeg`/`.png`) becomes
 *    `poster`. A `readme.md` becomes a `Resource { kind: "other" }` titled
 *    "<lesson-title> notes".
 *  - If the folder contains a `readme.md` and NO `.mp4`, the lesson is
 *    `reading`. The readme body is the lesson body.
 *  - Other files become resources: `.pdf` → kind `pdf`, `.pptx`/`.key` →
 *    kind `slides`, anything else → kind `other`.
 */
export type ClassifiedLesson =
  | {
      kind: "video";
      title: string;
      description: string;
      videoKey: string;
      /**
       * The video's actual on-disk basename (raw, pre-normalization). The
       * generator reads bytes via this — NOT via `videoKey`, whose basename
       * is slugified for the URL and may differ from disk until normalized.
       */
      videoFileName: string;
      posterKey: string | null;
      /**
       * Raw on-disk filenames paired 1:1 with `resourceKeys` by index. Lets
       * the generator preserve the original name even when no
       * `rename-manifest.json` entry matches (e.g. re-generating on a tree
       * whose manifest was lost or never written).
       */
      resourceRawNames: string[];
      resourceKeys: string[];
      readmeKey: string | null;
      readmeRawName: string | null;
    }
  | {
      kind: "reading";
      title: string;
      body: string;
      resourceKeys: string[];
      resourceRawNames: string[];
    };

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const SLIDES_EXTENSIONS = new Set([".pptx", ".key", ".ppt"]);

export function classifyLessonFolder(
  folderPath: string,
  lessonSlug: string,
  options: { titleFromNotesHeading?: boolean } = {},
): ClassifiedLesson {
  const files = readdirSync(folderPath, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  const videoFile = files.find((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()));
  const imageFile = files.find((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
  const readmeFile = files.find((f) => f.toLowerCase() === "readme.md");

  const resolveTitle = (): string =>
    options.titleFromNotesHeading === true && readmeFile !== undefined
      ? lessonTitle(lessonSlug, readFileSync(path.join(folderPath, readmeFile), "utf8"))
      : humanize(lessonSlug);

  if (videoFile) {
    const title = resolveTitle();
    const description =
      "Video lesson. The full description lives in the linked notes (Resource below).";
    const videoKey = `${lessonSlug}/${normalizeFileName(videoFile)}`;
    const posterKey = imageFile ? `${lessonSlug}/${normalizeFileName(imageFile)}` : null;
    const readmeKey = readmeFile ? `${lessonSlug}/${normalizeFileName(readmeFile)}` : null;
    const resourceKeys: string[] = [];
    const resourceRawNames: string[] = [];
    if (readmeKey && readmeFile) {
      resourceKeys.push(readmeKey);
      resourceRawNames.push(readmeFile);
    }
    for (const f of files) {
      if (f === videoFile) continue;
      if (f === imageFile) continue;
      if (f === readmeFile) continue;
      resourceKeys.push(`${lessonSlug}/${normalizeFileName(f)}`);
      resourceRawNames.push(f);
    }
    return {
      kind: "video",
      title,
      description,
      videoKey,
      videoFileName: videoFile,
      posterKey,
      resourceKeys,
      resourceRawNames,
      readmeKey,
      readmeRawName: readmeFile ?? null,
    };
  }

  if (readmeFile) {
    const body = readFileSync(path.join(folderPath, readmeFile), "utf8");
    const title = resolveTitle();
    const resourceKeys: string[] = [];
    const resourceRawNames: string[] = [];
    for (const f of files) {
      if (f === readmeFile) continue;
      if (IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase())) continue;
      resourceKeys.push(`${lessonSlug}/${normalizeFileName(f)}`);
      resourceRawNames.push(f);
    }
    return { kind: "reading", title, body, resourceKeys, resourceRawNames };
  }

  throw new Error(
    `Lesson folder "${folderPath}" has neither an .mp4 nor a readme.md — cannot classify.`,
  );
}

/**
 * Resource classification by file extension.
 */
export function classifyResourceKind(fileName: string): "pdf" | "slides" | "other" {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (SLIDES_EXTENSIONS.has(ext)) return "slides";
  return "other";
}

/**
 * Resource title from file name: strips the extension and humanizes.
 * Special-case: a `readme.md` becomes "<lesson-title> notes" via the
 * caller (we don't know the lesson title here).
 */
export function resourceTitleFromFile(fileName: string): string {
  const stem = path.basename(fileName, path.extname(fileName));
  return humanize(stem);
}

/**
 * "5-sound-natural-intonation-essentials" → "Sound natural intonation essentials".
 * Drops the leading number prefix if present (matches the folder pattern
 * "5 Sound Natural...").
 */
export function humanize(slug: string): string {
  const stripped = slug.replace(/^\d+-/, "");
  return stripped
    .split("-")
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * The first ATX (`# `) heading in a Markdown document, trimmed, or `null`
 * when there is none.
 *
 * @remarks
 * Lesson notes open with the lesson's real name, which is often richer than
 * anything the folder slug preserved — `# Fast /æ/` where the folder is only
 * `4-fast`. This is how the generator recovers it.
 *
 * Deliberately naive: the first `# ` line wins, with no tracking of fenced
 * code blocks. A `#` inside a fence before the real heading would be picked
 * up, but no lesson in the content has that shape, and a Markdown parser
 * here would be more machinery than the input justifies. Sub-headings
 * (`##`) and body text before the heading are skipped.
 *
 * @param markdown - Raw file contents
 * @returns The heading text without its `#` marker, or `null` if absent
 */
export function notesHeading(markdown: string): string | null {
  for (const line of markdown.split("\n")) {
    const match = /^#\s+(.*\S)\s*$/.exec(line);
    if (match) return match[1] as string;
  }
  return null;
}

/**
 * The title for a lesson whose module has opted into notes-derived titles.
 *
 * @remarks
 * Prefers the notes heading, because that is where the author wrote the
 * lesson's real name — `# Fast /æ/` for a folder the slug pipeline reduced
 * to `4-fast`.
 *
 * Falls back to the slug when there is no heading, and — deliberately —
 * when the heading matches the slug-derived title apart from
 * capitalization. Case survives slugification intact, so an all-caps
 * `# INTRO` sitting above a derived `Intro` is a styling choice in the
 * source document, not information the slug lost. Adopting it would put a
 * shouting row next to `Fast /i/` for no gain.
 *
 * @param lessonSlug - The lesson's slug, used for the fallback title
 * @param markdown - Raw contents of the lesson's `readme.md`
 * @returns The heading when it carries recovered information, else the
 *          slug-derived title
 */
export function lessonTitle(lessonSlug: string, markdown: string): string {
  const derived = humanize(lessonSlug);
  const heading = notesHeading(markdown);
  if (heading === null) return derived;
  return heading.toLowerCase() === derived.toLowerCase() ? derived : heading;
}

/**
 * Sequence number from a slug like "5-sound-natural-..." → 5. Falls back
 * to Number.MAX_SAFE_INTEGER when no number is present, so non-numbered
 * folders sort to the end.
 */
export function parseSequence(slug: string): number {
  const match = /^(\d+)-/.exec(slug);
  if (match && match[1]) {
    return Number.parseInt(match[1], 10);
  }
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Walks `dir` and returns the names of immediate subdirectories that
 * exist (no recursion). Used to discover module folders.
 */
export function listSubdirectories(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/**
 * Same as `listSubdirectories` but for the lesson folders inside a module.
 */
export function listLessonFolders(modulePath: string): string[] {
  if (!existsSync(modulePath)) return [];
  return readdirSync(modulePath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function folderExists(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}
