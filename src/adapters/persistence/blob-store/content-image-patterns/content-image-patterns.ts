import type { ContentLocations, ContentStore } from "../content-locations/content-locations";

/**
 * A `next/image` remote pattern, structurally matching Next's own type.
 *
 * @remarks
 * Declared here rather than imported from `next` because `next.config.ts`
 * consumes this module before the app's module graph exists, and a `next`
 * import at that point is a needless coupling.
 */
export type ContentImagePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
};

/**
 * The `images.remotePatterns` entries a location manifest requires.
 *
 * @remarks
 * `next/image` rejects any remote host absent from that list with a hard 500,
 * so placing posters in a bucket has to widen the allowlist too. Deriving it
 * from the same manifest that routes the content keeps the promise honest:
 * moving an asset stays a configuration change, never a code change.
 *
 * Signed stores contribute nothing — their posters are fetched from the app's
 * own origin through the signing endpoint, not from the bucket.
 *
 * Each pattern is scoped to its store's path prefix rather than the whole
 * host, so adding one bucket does not implicitly allowlist every image on that
 * domain.
 *
 * @param manifest - The parsed location manifest, or `null` when there is none
 * @returns One pattern per store reachable at an absolute http(s) URL
 *
 * @category Adapters
 */
export function contentImageRemotePatterns(
  manifest: ContentLocations | null,
): ContentImagePattern[] {
  if (!manifest) return [];
  return Object.values(manifest.stores)
    .map(publicUrlOf)
    .filter((url): url is string => url !== undefined)
    .map(toRemotePattern)
    .filter((pattern): pattern is ContentImagePattern => pattern !== undefined);
}

/** The absolute URL prefix a store is reachable at, if it has one. */
function publicUrlOf(store: ContentStore): string | undefined {
  if (store.driver === "local") return store.baseUrl;
  return store.visibility === "public" ? store.publicUrl : undefined;
}

/**
 * Turns an absolute http(s) prefix into a scoped remote pattern. A
 * site-relative prefix (the local default) and any non-http scheme yield
 * nothing: neither is a remote host Next needs to be told about.
 */
function toRemotePattern(publicUrl: string): ContentImagePattern | undefined {
  let parsed: URL;
  try {
    parsed = new URL(publicUrl);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;

  return {
    protocol: parsed.protocol === "https:" ? "https" : "http",
    hostname: parsed.hostname,
    ...(parsed.port ? { port: parsed.port } : {}),
    pathname: `${parsed.pathname.replace(/\/+$/, "")}/**`,
  };
}
