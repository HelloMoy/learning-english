/**
 * Extracts the YouTube video id from a lesson's `source`, when that source is
 * a YouTube link.
 *
 * @remarks
 * A `VideoLesson.source` is an opaque URL: the project hosts most lectures as
 * MP4 files, but some are published on YouTube. This is the one place that
 * tells the two apart, so the player can pick a provider without a vendor
 * conditional spreading through the component tree.
 *
 * **Returns `undefined`, not `null`, and never throws.** A source that is not
 * a YouTube link is the ordinary case — most lessons — not a failure, so
 * there is no error to model. The codebase's `Result<T, DomainError>`
 * convention governs use cases; this is a pure classifier at the delivery
 * edge, and a discriminated union here would be ceremony with no caller for
 * its error arm.
 *
 * **Parsed with `URL`, not matched with a regex.** The host has to be matched
 * exactly: `https://cdn.example.com/youtube.com/watch?v=x.mp4` is a
 * self-hosted file whose *path* mentions YouTube, and any pattern that scans
 * the whole string for `youtube.com` would hand it to the wrong provider.
 * Parsing also yields `searchParams` and a normalized pathname for free. A
 * malformed source makes the constructor throw; that is caught and reported
 * as "not YouTube", so bad data degrades to the direct-source path instead of
 * breaking the lesson page.
 *
 * Extra query parameters (`si`, `list`, `t`) are discarded. The provider owns
 * the embed URL it builds, and the starting position is the stored playback
 * position applied by a seek — not something encoded in a link.
 *
 * @param source - The lesson's `source` URL, in any form
 * @returns The video id, or `undefined` when the source is not a YouTube link
 *
 * @example
 * ```ts
 * youtubeVideoIdFrom("https://www.youtube.com/embed/yY7RWGUbqng?si=nB8s");
 * // "yY7RWGUbqng"
 * youtubeVideoIdFrom("/videos/long-vs-short.mp4");
 * // undefined
 * ```
 *
 * @category Utilities
 */
export function youtubeVideoIdFrom(source: string): string | undefined {
  const url = parseUrl(source);
  if (url === undefined) return undefined;

  if (isShortLinkHost(url.hostname)) return videoIdFromFirstPathSegment(url);
  if (!isWatchPageHost(url.hostname)) return undefined;

  const watchParam = url.searchParams.get("v");
  if (watchParam !== null) return nonEmpty(watchParam);

  return videoIdFromEmbedPath(url);
}

/** Hosts that serve the full site: `/watch?v=`, `/embed/`, `/shorts/`. */
const WATCH_PAGE_HOSTS = ["youtube.com", "youtube-nocookie.com"];

/** The link-shortener host, whose entire path is the video id. */
const SHORT_LINK_HOST = "youtu.be";

/** Path prefixes that carry the video id as their next segment. */
const ID_BEARING_PREFIXES = ["embed", "shorts"];

/** Subdomains that address the same site and carry no meaning for us. */
const IGNORED_SUBDOMAINS = ["www.", "m."];

function parseUrl(source: string): URL | undefined {
  try {
    return new URL(source);
  } catch {
    return undefined;
  }
}

function withoutSubdomain(hostname: string): string {
  const ignored = IGNORED_SUBDOMAINS.find((prefix) => hostname.startsWith(prefix));
  return ignored === undefined ? hostname : hostname.slice(ignored.length);
}

function isWatchPageHost(hostname: string): boolean {
  return WATCH_PAGE_HOSTS.includes(withoutSubdomain(hostname));
}

function isShortLinkHost(hostname: string): boolean {
  return withoutSubdomain(hostname) === SHORT_LINK_HOST;
}

function pathSegments(url: URL): string[] {
  return url.pathname.split("/").filter((segment) => segment.length > 0);
}

function videoIdFromFirstPathSegment(url: URL): string | undefined {
  return nonEmpty(pathSegments(url)[0]);
}

function videoIdFromEmbedPath(url: URL): string | undefined {
  const [prefix, videoId] = pathSegments(url);
  if (prefix === undefined || !ID_BEARING_PREFIXES.includes(prefix)) return undefined;
  return nonEmpty(videoId);
}

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.length > 0 ? value : undefined;
}
