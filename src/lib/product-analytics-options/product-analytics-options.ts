import type { CaptureResult, PostHogConfig } from "posthog-js";

/**
 * The path on the application's own origin that analytics requests are sent
 * to, and that the proxy relays to PostHog.
 *
 * @remarks
 * Deliberately not a name content blockers list: PostHog advises against
 * `/ingest`, `/analytics` and the like.
 *
 * @category Observability
 */
export const ANALYTICS_RELAY_PATH = "/pulse";

/**
 * The class that keeps an element out of usage data.
 *
 * @remarks
 * PostHog's own marker, and not ours to rename: click capture looks for this
 * exact class. An element carrying it is replaced by a blank block of the
 * same size in a session recording, and no click on or inside it is captured. Put it on every element that prints the learner's email address —
 * the address is their sign-in identifier and their recovery channel, and
 * nothing about how the site is used needs it.
 *
 * @example
 * ```tsx
 * <p className={NOT_CAPTURED_CLASS}>{t("sent", { email })}</p>
 * ```
 *
 * @category Observability
 */
export const NOT_CAPTURED_CLASS = "ph-no-capture";

/**
 * What the PostHog browser client is started with.
 *
 * @category Observability
 */
export type ProductAnalyticsOptions = {
  /** The PostHog project token. Public by design: it only permits sending events. */
  token: string;
  /** The client configuration; every privacy claim the policy makes is a field here. */
  config: Partial<PostHogConfig>;
};

/**
 * Decides whether PostHog starts, and with what.
 *
 * @remarks
 * Without a token nothing starts, which keeps local development, CI and any
 * build without the variable silent — the same contract as
 * `sentryInitOptions`.
 *
 * The configuration is where the privacy policy's wording is kept true, so
 * each field is asserted by its own test:
 *
 * - `cookieless_mode: "on_reject"` — nothing is stored or sent until the
 *   visitor answers the consent banner; a refusal is still counted, without
 *   cookies or storage.
 * - `cross_subdomain_cookie: false` — the default shares the cookie with every
 *   subdomain, and `docs.english-course.online` is served by a third party.
 * - `disable_session_recording: true` — recording is started by the
 *   application, never by a setting in the PostHog project.
 * - `recordBody` / `recordHeaders` — the sign-in and sign-up requests carry
 *   the password in their body.
 * - `capture_exceptions: false` — errors go to Sentry, whose pipeline strips
 *   addresses and message bodies.
 * - `before_send` — the query string and fragment are removed from every web
 *   address in every event; the password-reset link carries its token there.
 *
 * @example
 * ```ts
 * const options = productAnalyticsOptions(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
 * if (options) posthog.init(options.token, options.config);
 * ```
 *
 * @param token - The PostHog project token, if one is configured
 * @returns The start options, or `null` when PostHog must stay off
 *
 * @category Observability
 */
export function productAnalyticsOptions(token: string | undefined): ProductAnalyticsOptions | null {
  if (!token) return null;
  return {
    token,
    config: {
      api_host: ANALYTICS_RELAY_PATH,
      rewriteRequestPath: withoutTrailingSlash,
      ui_host: "https://us.posthog.com",
      defaults: "2026-05-30",
      cookieless_mode: "on_reject",
      person_profiles: "identified_only",
      cross_subdomain_cookie: false,
      secure_cookie: true,
      disable_session_recording: true,
      session_recording: {
        maskAllInputs: true,
        blockClass: NOT_CAPTURED_CLASS,
        recordBody: false,
        recordHeaders: false,
      },
      enable_recording_console_log: false,
      capture_exceptions: false,
      capture_heatmaps: true,
      before_send: withoutUrlSecrets,
    },
  };
}

/**
 * PostHog's endpoints end in a slash (`/e/`), and Next answers any such path
 * with a redirect to the slash-less one before the proxy ever sees it — an
 * extra round trip for every event. PostHog serves both spellings, so the
 * SDK is told to ask for the one Next will not redirect.
 */
function withoutTrailingSlash(url: URL): URL {
  if (url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  return url;
}

const WEB_PROTOCOLS = ["http:", "https:"];

/**
 * Removes the query string and fragment from every web address in an event,
 * at any depth, before PostHog sends it.
 *
 * Everything rather than a list of parameter names: the password-reset link
 * carries its token there, and a list only protects against the parameters
 * someone remembered. Campaign parameters survive, because the SDK has
 * already copied `utm_*` into properties of their own.
 */
function withoutUrlSecrets(event: CaptureResult | null): CaptureResult | null {
  return event && (withoutQueryStrings(event) as CaptureResult);
}

function withoutQueryStrings(value: unknown): unknown {
  if (typeof value === "string") return withoutQueryString(value);
  if (Array.isArray(value)) return value.map(withoutQueryStrings);
  if (isPlainObject(value)) return mapValues(value, withoutQueryStrings);
  return value;
}

function withoutQueryString(text: string): string {
  if (!URL.canParse(text)) return text;
  const url = new URL(text);
  if (!WEB_PROTOCOLS.includes(url.protocol) || !(url.search || url.hash)) return text;
  url.search = "";
  url.hash = "";
  return url.toString();
}

// A `Date` or any other class instance is passed through untouched.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

function mapValues(
  record: Record<string, unknown>,
  transform: (value: unknown) => unknown,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, transform(value)]));
}
