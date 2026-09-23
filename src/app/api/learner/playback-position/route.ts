import { getLearnerDependencies } from "@/adapters/persistence/turso/learner-dependencies/learner-dependencies";
import { PlaybackPosition } from "@/domain/ports/playback-position-repository/playback-position";
import { getAuth } from "@/lib/auth/auth";

/**
 * The page-hide flush of the playback position.
 *
 * @remarks
 * `navigator.sendBeacon` is the one request a closing page is allowed to
 * finish, and it cannot call a Server Action — so the last position of a
 * session arrives here as a bare body. The learner is whoever the session
 * cookie says; the body only names the lesson and the seconds.
 *
 * @returns `204` once saved, `401` without a session, `400` for a body that is
 *          not a playback position
 */
export async function POST(request: Request): Promise<Response> {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });

  const position = PlaybackPosition.safeParse(await jsonOf(request));
  if (!position.success) return new Response(null, { status: 400 });

  const { useCases } = getLearnerDependencies(session.user.id);
  const recorded = await useCases.recordPlaybackPosition(position.data);
  return new Response(null, { status: recorded.isOk() ? 204 : 400 });
}

async function jsonOf(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
