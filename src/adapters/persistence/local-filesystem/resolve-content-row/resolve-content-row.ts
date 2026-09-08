import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import { Lesson, ReadingLesson, VideoLesson } from "@/domain/entities/lesson/lesson";
import { Resource } from "@/domain/entities/resource/resource";
import { isAbsoluteHttpUrl } from "@/domain/entities/url-or-path/url-or-path";

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
 *
 * The one exception is a value that is ALREADY a URL: see
 * {@link resolveContentValue}.
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
    source: resolveContentValue(row.source, blobStore),
    // An absent poster stays absent. Resolving `undefined` would yield
    // `<base>/undefined`, which satisfies urlOrRelativePath() and then 404s.
    ...(poster === undefined ? {} : { poster: resolveContentValue(poster, blobStore) }),
  });
}

export function resolveResourceRow(row: ResourceRow, blobStore: BlobStore): Resource {
  return Resource.parse({ ...row, url: resolveContentValue(row.url, blobStore) });
}

/**
 * Turns a content key into a URL, leaving a value that is already one alone.
 *
 * @remarks
 * A row's field holds a content key in the ordinary case, but it may instead
 * hold a URL the content store knows nothing about — the Basic Course's
 * lectures are served by YouTube. Passing that to `BlobStore.url()` would
 * prepend the store's base and produce `<base>/https://www.youtube.com/...`,
 * which still satisfies `urlOrRelativePath()` and then plays nothing.
 *
 * What decides is the value's own shape, never the field or the row it came
 * from, so `source`, `poster` and `Resource.url` cannot drift into disagreeing
 * about what counts as a key. `isAbsoluteHttpUrl` is the domain's own
 * predicate — the same one that decides whether the parsed entity will accept
 * the result.
 *
 * @param value - A content key, or a URL that needs no resolution
 * @param blobStore - The store consulted only when `value` is a key
 * @returns The resolved URL, or `value` unchanged when it was already absolute
 */
function resolveContentValue(value: string, blobStore: BlobStore): string {
  return isAbsoluteHttpUrl(value) ? value : blobStore.url(value);
}
