import "server-only";

import { z } from "zod";

const REMOTE_LIBSQL_SCHEME = "libsql:";

const serverEnvShape = z.object({
  TURSO_DATABASE_URL: z.url(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z.stringbool(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1),
  AUTH_RATE_LIMIT: z.stringbool().optional(),
  SENTRY_DSN: z.url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
});

const serverEnvSchema = serverEnvShape.refine(
  (env) =>
    new URL(env.TURSO_DATABASE_URL).protocol !== REMOTE_LIBSQL_SCHEME ||
    env.TURSO_AUTH_TOKEN !== undefined,
  {
    path: ["TURSO_AUTH_TOKEN"],
    message: "is required when TURSO_DATABASE_URL is a remote libsql:// URL",
  },
);

/**
 * Every server-side environment variable the application reads, validated.
 *
 * @category Configuration
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * The name of every server environment variable {@link serverEnv} reads,
 * required or optional.
 *
 * @remarks
 * The deployment runbook is tested against this list, so a new variable
 * cannot ship undocumented.
 *
 * @category Configuration
 */
export const SERVER_ENV_VARIABLES = Object.keys(serverEnvShape.shape) as ReadonlyArray<
  keyof ServerEnv
>;

/**
 * Whether Better Auth rate-limits sign-in, sign-up and the email endpoints.
 *
 * @remarks
 * On in production and off elsewhere, unless `AUTH_RATE_LIMIT` says
 * otherwise. The override exists for CI, whose end-to-end suite runs a
 * production build and signs in hundreds of accounts from one address.
 * Production itself never sets it.
 *
 * @param env - The parsed `AUTH_RATE_LIMIT` override, if any
 * @param nodeEnv - The running `NODE_ENV`
 * @returns `true` when requests must be rate-limited
 */
export function isAuthRateLimited(
  env: Pick<ServerEnv, "AUTH_RATE_LIMIT">,
  nodeEnv = process.env.NODE_ENV,
): boolean {
  return env.AUTH_RATE_LIMIT ?? nodeEnv === "production";
}

let cached: ServerEnv | undefined;

/**
 * The validated server environment.
 *
 * @remarks
 * Parsed on first use rather than at import, because `next build` evaluates
 * server modules without the runtime secrets; failing at import would break
 * every build that does not carry production credentials. The parsed value is
 * memoized for the life of the process.
 *
 * @returns The parsed environment
 * @throws Error naming every missing or malformed variable
 *
 * @example
 * ```ts
 * const { TURSO_DATABASE_URL } = serverEnv();
 * ```
 */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv();
  return cached;
}

/**
 * Forgets the memoized environment so the next {@link serverEnv} call parses
 * `process.env` again.
 *
 * @internal
 */
export function resetServerEnvForTests(): void {
  cached = undefined;
}

function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (result.success) return result.data;
  throw new Error(`Invalid server environment:\n${describeIssues(result.error)}`);
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
}
