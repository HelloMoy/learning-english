import { getAuth } from "@/lib/auth/auth";

import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";

/**
 * Base safe-action client. Use this for any Server Action that needs validation.
 *
 * Example:
 *   import { actionClient } from "@/lib/safe-action/safe-action";
 *   import { z } from "zod";
 *
 *   export const createUserAction = actionClient
 *     .schema(z.object({ name: z.string().min(1), email: z.email() }))
 *     .action(async ({ parsedInput }) => {
 *       // parsedInput is fully typed
 *     });
 *
 * For middleware/auth, create a derived client:
 *   const authActionClient = actionClient.use(async ({ next }) => {
 *     const session = await auth();
 *     if (!session) throw new Error("Unauthorized");
 *     return next({ ctx: { userId: session.userId } });
 *   });
 */
export const actionClient = createSafeActionClient({
  // Default options can be overridden per-action:
  // - handleServerError: customize error messages sent to the client
  // - defaultValidationErrorsShape: "flattened" | "structured"
});

/**
 * Raised inside {@link learnerActionClient} when the request has no live
 * session; `next-safe-action` turns it into the result's `serverError`.
 */
class MissingLearnerSessionError extends Error {
  constructor() {
    super("A signed-in learner is required");
  }
}

/**
 * The safe-action client for anything that reads or writes one learner's
 * data.
 *
 * @remarks
 * Its middleware verifies the session from the request's own headers and
 * hands the action `ctx.learnerId`. That is the only way an action learns who
 * the learner is: no input schema built on this client may carry a user or
 * learner id, so a client cannot act for someone else. Without a session the
 * action body never runs and the caller receives `serverError`.
 *
 * @example
 * ```ts
 * export const markLessonCompleteAction = learnerActionClient
 *   .inputSchema(z.object({ lessonId: LessonId }))
 *   .action(async ({ parsedInput, ctx }) => markFor(ctx.learnerId, parsedInput.lessonId));
 * ```
 */
export const learnerActionClient = actionClient.use(async ({ next }) => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) throw new MissingLearnerSessionError();
  return next({ ctx: { learnerId: session.user.id } });
});
