import { contentBlobStoreFromEnv } from "@/adapters/persistence/blob-store/create-content-blob-store/create-content-blob-store";

import { contentRedirect } from "./content-redirect";

/**
 * Signing endpoint for privately-stored course content.
 *
 * @remarks
 * Keys routed to a private store resolve to this path instead of to a bucket
 * URL, which is what lets `BlobStore.url()` stay synchronous while signing is
 * asynchronous. The response is always a redirect — see {@link contentRedirect}
 * for why bytes are never proxied.
 *
 * Dynamic by construction: a signed URL is time-limited, so this response must
 * never be statically cached.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await context.params;
  return contentRedirect(key.join("/"), contentBlobStoreFromEnv());
}
