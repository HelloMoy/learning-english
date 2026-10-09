/**
 * Errors raised inside third-party code as it is torn down, which the
 * application can neither handle nor prevent and no learner can observe.
 *
 * @remarks
 * Each pattern is anchored to the whole message, so an error that merely
 * mentions the same words is still reported. One entry so far:
 *
 * - `@vidstack/react` (seen in 1.15.6, unchanged in 1.15.7). The YouTube
 *   provider keeps a promise for every command it posts to the iframe, only
 *   ever settles the play and pause ones, and rejects the rest with the
 *   string `provider destroyed` when the player unmounts — several times on
 *   every exit from a lesson. Remove the entry once the provider stops
 *   leaking those promises.
 *
 * @category Observability
 */
export const THIRD_PARTY_TEARDOWN_NOISE: readonly RegExp[] = [
  /^Non-Error promise rejection captured with value: provider destroyed$/,
];

/**
 * The options every Sentry runtime (browser, Node.js, edge) starts with.
 *
 * @category Observability
 */
export type SentryInitOptions = {
  dsn: string;
  sendDefaultPii: false;
  environment?: string;
  ignoreErrors: RegExp[];
};

/**
 * Decides whether Sentry starts, and with what.
 *
 * @remarks
 * Error reporting only: no tracing and no session replay, so the options
 * leave every sample rate out. Without a DSN nothing starts, which keeps
 * local development, CI and a build without Sentry variables silent. Known
 * third-party teardown noise is dropped before it is sent — see
 * {@link THIRD_PARTY_TEARDOWN_NOISE}.
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
  return {
    dsn,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV,
    ignoreErrors: [...THIRD_PARTY_TEARDOWN_NOISE],
  };
}
