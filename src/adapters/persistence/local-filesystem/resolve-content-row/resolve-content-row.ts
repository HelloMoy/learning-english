import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import { Lesson, ReadingLesson, VideoLesson } from "@/domain/entities/lesson/lesson";
import { Resource } from "@/domain/entities/resource/resource";

import type { z } from "zod";

/**
 * A `VideoLesson` as it is stored in the generated seed: identical to the
 * entity's input shape except that `source` and `poster` hold opaque content
 * KEYS (`course/module/lesson/video.mp4`) rather than URLs.
 *
 * The distinction is not visible in the type system — both are `string` — so
 * it is enforced by construction: only the generator writes rows, and only
 * this module turns one into an entity.
 */
export type VideoLessonRow = Omit<z.input<typeof VideoLesson>, "source" | "poster"> & {
  /** Content key, not a URL. */
  source: string;
  /** Content key, not a URL. Absent when the lesson folder had no image. */
  poster?: string;
};

/** A `ReadingLesson` row. It carries no content key, so it needs no resolution. */
export type ReadingLessonRow = z.input<typeof ReadingLesson>;

export type LessonRow = VideoLessonRow | ReadingLessonRow;

/** A `Resource` row whose `url` holds a content KEY rather than a URL. */
export type ResourceRow = Omit<z.input<typeof Resource>, "url"> & {
  /** Content key, not a URL. */
  url: string;
};

/**
 * The single place where a content key becomes a URL.
 *
 * Resolution must happen strictly BEFORE `parse`: `urlOrRelativePath()`
 * rejects a bare key (no leading `/`, no scheme), so a key can never live
 * inside a parsed domain entity. Parsing afterwards means a row that resolves
 * to something malformed is rejected here, at the adapter boundary, rather
 * than reaching a `src` attribute in the UI.
 *
 * Both functions are pure and synchronous — `BlobStore.url` is string work.
 */
export function resolveLessonRow(row: LessonRow, blobStore: BlobStore): Lesson {
  // Discriminate on `kind`, mirroring the domain's own discriminated union,
  // rather than sniffing for the presence of a `source` property.
  if (row.kind === "reading") {
    return Lesson.parse(row);
  }

  // `poster` is destructured out rather than spread over: spreading would
  // carry the unresolved key through when the conditional below is skipped.
  const { poster, ...rest } = row;
  return Lesson.parse({
    ...rest,
    source: blobStore.url(row.source),
    // An absent poster stays absent. Resolving `undefined` would yield
    // `<base>/undefined`, which satisfies urlOrRelativePath() and then 404s.
    ...(poster === undefined ? {} : { poster: blobStore.url(poster) }),
  });
}

export function resolveResourceRow(row: ResourceRow, blobStore: BlobStore): Resource {
  return Resource.parse({ ...row, url: blobStore.url(row.url) });
}
