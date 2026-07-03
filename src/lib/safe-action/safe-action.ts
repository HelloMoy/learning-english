import { createSafeActionClient } from "next-safe-action";

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
