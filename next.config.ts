import path from "node:path";

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { contentImageRemotePatterns } from "./src/adapters/persistence/blob-store/content-image-patterns/content-image-patterns";
import {
  CONTENT_LOCATIONS_FILE,
  loadContentLocations,
} from "./src/adapters/persistence/blob-store/content-locations/content-locations";

/**
 * Course posters are rendered through `next/image`, which refuses any remote
 * host not declared here. Placing content in a bucket therefore has to widen
 * the image allowlist too, or every lesson page 500s with "Invalid src prop …
 * hostname is not configured".
 *
 * Deriving the patterns from the same manifest that routes the content keeps
 * the promise honest: moving an asset stays a configuration change, not a code
 * change. One pattern per PUBLIC store; signed stores contribute none, because
 * their posters come from the app's own origin through `/api/content`.
 *
 * Caveat: unlike `contentBlobStoreFromEnv()`, which reads the manifest per
 * call, this is evaluated once when the config loads. Editing
 * `content-locations.json` in a running dev server repoints URLs but not this
 * allowlist — restart the server after such a change.
 */
function imageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const manifestPath = path.resolve(process.env.CONTENT_LOCATIONS_PATH ?? CONTENT_LOCATIONS_FILE);
  return contentImageRemotePatterns(loadContentLocations(manifestPath));
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: imageRemotePatterns(),
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Source maps upload only when the build carries SENTRY_AUTH_TOKEN; without it
// the wrapper just instruments the build and nothing leaves the machine.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  telemetry: false,
});
