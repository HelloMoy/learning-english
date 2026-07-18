import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

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
      posterKey: string | null;
      resourceKeys: string[];
      readmeKey: string | null;
    }
  | {
      kind: "reading";
      title: string;
      body: string;
      resourceKeys: string[];
    };

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const SLIDES_EXTENSIONS = new Set([".pptx", ".key", ".ppt"]);

export function classifyLessonFolder(folderPath: string, lessonSlug: string): ClassifiedLesson {
  const files = readdirSync(folderPath, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  const videoFile = files.find((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()));
  const imageFile = files.find((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
  const readmeFile = files.find((f) => f.toLowerCase() === "readme.md");

  if (videoFile) {
    const title = humanize(lessonSlug);
    const description =
      "Video lesson. The full description lives in the linked notes (Resource below).";
    const videoKey = `${lessonSlug}/${videoFile}`;
    const posterKey = imageFile ? `${lessonSlug}/${imageFile}` : null;
    const readmeKey = readmeFile ? `${lessonSlug}/${readmeFile}` : null;
    const resourceKeys: string[] = [];
    if (readmeKey) resourceKeys.push(readmeKey);
    for (const f of files) {
      if (f === videoFile) continue;
      if (f === imageFile) continue;
      if (f === readmeFile) continue;
      resourceKeys.push(`${lessonSlug}/${f}`);
    }
    return {
      kind: "video",
      title,
      description,
      videoKey,
      posterKey,
      resourceKeys,
      readmeKey,
    };
  }

  if (readmeFile) {
    const body = readFileSync(path.join(folderPath, readmeFile), "utf8");
    const title = humanize(lessonSlug);
    const resourceKeys: string[] = [];
    for (const f of files) {
      if (f === readmeFile) continue;
      if (IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase())) continue;
      resourceKeys.push(`${lessonSlug}/${f}`);
    }
    return { kind: "reading", title, body, resourceKeys };
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
