import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Course posters are rendered through `next/image`, which refuses any remote
 * host not declared here. Pointing `CONTENT_BASE_URL` at a bucket or CDN
 * therefore has to widen the image allowlist too, or every lesson page 500s
 * with "Invalid src prop … hostname is not configured".
 *
 * Deriving the pattern from the same variable that builds the BlobStore keeps
 * the promise honest: repointing content storage stays a configuration
 * change, not a code change.
 *
 * Unset, or set to a site-relative prefix (the default
 * `/local-filesystem-lesson`), yields no remote pattern at all — images are
 * served from the app's own origin exactly as before.
 *
 * Caveat: unlike `buildBlobStore()`, which reads the variable per call, this
 * is evaluated once when the config loads. Flipping `CONTENT_BASE_URL` to a
 * new HOST in a running dev server repoints the URLs but not this allowlist —
 * restart the server after such a change.
 */
function contentImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.CONTENT_BASE_URL;
  if (!base) return [];

  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    // Site-relative prefix — same origin, nothing to allowlist.
    return [];
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return [];

  return [
    {
      protocol: parsed.protocol === "https:" ? "https" : "http",
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      // Scope the allowlist to the configured prefix rather than the whole
      // host, so this does not quietly become "any image from that domain".
      pathname: `${parsed.pathname.replace(/\/+$/, "")}/**`,
    },
  ];
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: contentImageRemotePatterns(),
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
