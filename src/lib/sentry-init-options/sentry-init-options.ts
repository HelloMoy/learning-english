/**
 * The options every Sentry runtime (browser, Node.js, edge) starts with.
 *
 * @category Observability
 */
export type SentryInitOptions = {
  dsn: string;
  sendDefaultPii: false;
  environment?: string;
};

/**
 * Decides whether Sentry starts, and with what.
 *
 * @remarks
 * Error reporting only: no tracing and no session replay, so the options
 * leave every sample rate out. Without a DSN nothing starts, which keeps
 * local development, CI and a build without Sentry variables silent.
 *
 * @example
 * ```ts
 * const options = sentryInitOptions(process.env.SENTRY_DSN);
 * if (options) Sentry.init(options);
 * ```
 *
 * @param dsn - The project DSN, if one is configured
 * @returns The init options, or `null` when Sentry must stay off
 */
export function sentryInitOptions(dsn: string | undefined): SentryInitOptions | null {
  if (!dsn) return null;
  return { dsn, sendDefaultPii: false, environment: process.env.VERCEL_ENV };
}
