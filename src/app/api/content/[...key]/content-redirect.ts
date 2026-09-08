import { InvalidBlobKeyError } from "@/adapters/persistence/blob-store/blob-key/blob-key";
import type { RoutingBlobStore } from "@/adapters/persistence/blob-store/routing-blob-store/routing-blob-store";

/**
 * Answers a content request with a redirect to wherever the asset actually
 * lives.
 *
 * @remarks
 * Never streams bytes. Proxying would put the whole media corpus through the
 * Node process and force this route to reimplement `Range` handling for video
 * seeking; a redirect lets the browser fetch and seek directly against the
 * bucket, which is what buckets and CDNs are for. The browser follows the
 * redirect once per asset, then talks to the store for every range after.
 *
 * A private store's key is answered with a freshly-signed URL. A public one is
 * redirected to its permanent URL rather than 404ing, so a link minted while a
 * store was private keeps working after it is opened up.
 *
 * @param key - The content key, already joined from the catch-all segments
 * @param blobStore - The routing store for this request
 * @returns A 302 to the asset, a 400 for an unsafe key, or a 404 for a missing one
 */
export async function contentRedirect(key: string, blobStore: RoutingBlobStore): Promise<Response> {
  try {
    if (!blobStore.isSignedKey(key)) {
      return redirectTo(blobStore.url(key));
    }
  } catch (error) {
    if (error instanceof InvalidBlobKeyError) return new Response(null, { status: 400 });
    throw error;
  }

  // One HEAD before signing, so a missing object is a 404 here rather than an
  // opaque storage-provider error page after the redirect. It costs one round
  // trip per asset, not per range request.
  if (!(await blobStore.exists(key))) {
    return new Response(null, { status: 404 });
  }
  return redirectTo(await blobStore.signedUrlFor(key));
}

/**
 * 302 rather than 307/308: the redirect is not permanent (a signed URL expires
 * and a store can move), and it must not be cached as one.
 */
function redirectTo(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}
