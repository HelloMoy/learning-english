import type { ProductAnalyticsOptions } from "@/lib/product-analytics-options/product-analytics-options";

import type { PostHog } from "posthog-js";
import { createStore } from "zustand/vanilla";

/**
 * The lesson an event happened in.
 *
 * @remarks
 * The ID alone: it is unique across the catalogue, and the page address every
 * event already carries names the course and the module.
 *
 * @category Observability
 */
export type LessonReference = { lessonId: string };

/**
 * Every named event the application sends, and the type of each property.
 *
 * @remarks
 * Clicks on ordinary controls are captured by PostHog on its own, with their
 * text. This catalogue is for what a click cannot say: where in the video,
 * who completed the lesson, whether an enrollment or a claim was really saved.
 *
 * A property is an identifier, an enumerated value, a boolean or a number —
 * never free text, and never anything a learner typed.
 *
 * @category Observability
 */
export type ProductEvents = {
  video_played: LessonReference & { positionSeconds: number };
  video_paused: LessonReference & { positionSeconds: number };
  video_seeked: LessonReference & { fromSeconds: number; toSeconds: number };
  video_speed_changed: LessonReference & { rate: number };
  video_ended: LessonReference;
  lesson_completed: LessonReference & { by: "learner" | "playback" };
  course_enrolled: { courseSlug: string };
  prize_claimed: { moduleSlug: string };
};

/**
 * The part of the PostHog client the application uses.
 *
 * @remarks
 * Structural on purpose: the real client satisfies it as it is, and a test
 * replaces it with nine functions instead of the SDK.
 *
 * @category Observability
 */
export type ProductAnalyticsClient = Pick<
  PostHog,
  | "capture"
  | "identify"
  | "reset"
  | "opt_in_capturing"
  | "opt_out_capturing"
  | "get_explicit_consent_status"
  | "get_property"
  | "startSessionRecording"
  | "stopSessionRecording"
>;

/**
 * Where a visitor's answer to the consent banner stands.
 *
 * @remarks
 * `unavailable` means PostHog was never started — no project token — so there
 * is nothing to consent to and no banner to show.
 *
 * @category Observability
 */
export type ConsentStatus = ReturnType<PostHog["get_explicit_consent_status"]> | "unavailable";

/**
 * The consent question as the interface sees it.
 *
 * @category Observability
 */
export type ConsentState = {
  status: ConsentStatus;
  /** The visitor asked to change an answer already given; the banner is open again. */
  isReconsidering: boolean;
};

const NOT_STARTED: ConsentState = { status: "unavailable", isReconsidering: false };

/**
 * The consent question, for the banner and the footer control to subscribe to.
 *
 * @remarks
 * PostHog owns the answer; this mirrors it so React can re-render when it
 * changes. Written only by this module.
 *
 * @category Observability
 */
export const consentStore = createStore<ConsentState>(() => NOT_STARTED);

let client: ProductAnalyticsClient | undefined;

/**
 * Loads the PostHog SDK, starts it, and hands it to this module.
 *
 * @remarks
 * Called once, from `instrumentation-client`, and only when a project token
 * is configured. Until then every function here does nothing, which is what
 * keeps development, tests and CI silent without a check at any call site.
 *
 * The SDK is imported here rather than at the top of the file: a static
 * import would put it in every page's first bundle, including builds that
 * never start it.
 *
 * @example
 * ```ts
 * const options = productAnalyticsOptions(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
 * if (options) void startProductAnalytics(options);
 * ```
 *
 * @param options - The token and configuration, from `productAnalyticsOptions`
 *
 * @category Observability
 */
export async function startProductAnalytics({
  token,
  config,
}: ProductAnalyticsOptions): Promise<void> {
  const { default: posthog } = await import("posthog-js");
  posthog.init(token, config);
  attachProductAnalyticsClient(posthog);
}

/**
 * Hands this module a started client.
 *
 * @remarks
 * {@link startProductAnalytics} is the production caller; tests attach a fake.
 *
 * @param started - The initialized client
 *
 * @category Observability
 */
export function attachProductAnalyticsClient(started: ProductAnalyticsClient): void {
  client = started;
  publishConsent();
}

/**
 * Forgets the client, returning this module to its never-started state.
 *
 * @internal
 */
export function detachProductAnalyticsClient(): void {
  client = undefined;
  consentStore.setState(NOT_STARTED, true);
}

/**
 * Sends one named event from the catalogue.
 *
 * @example
 * ```ts
 * captureProductEvent("lesson_completed", { lessonId, by: "learner" });
 * ```
 *
 * @param name - The event, as {@link ProductEvents} declares it
 * @param properties - Exactly the properties that event declares
 *
 * @category Observability
 */
export function captureProductEvent<Name extends keyof ProductEvents>(
  name: Name,
  properties: ProductEvents[Name],
): void {
  client?.capture(name, properties);
}

/**
 * The visitor's answer to the consent banner.
 *
 * @returns The current status
 *
 * @category Observability
 */
export function consentStatus(): ConsentStatus {
  return consentStore.getState().status;
}

/**
 * Records that the visitor accepted cookies, identification and recording.
 *
 * @category Observability
 */
export function grantConsent(): void {
  client?.opt_in_capturing();
  publishConsent();
}

/**
 * Records that the visitor declined.
 *
 * @remarks
 * PostHog switches to its cookieless mode: the identity is reset, its cookie
 * and storage are cleared, and the visit is still counted anonymously.
 *
 * @category Observability
 */
export function denyConsent(): void {
  client?.opt_out_capturing();
  publishConsent();
}

/**
 * Reopens the consent question for a visitor who already answered it.
 *
 * @category Observability
 */
export function reconsiderConsent(): void {
  if (client) consentStore.setState({ isReconsidering: true });
}

/**
 * Attributes later activity to a learner's account, if they accepted.
 *
 * @param accountId - The learner's account ID; never an email address or name
 *
 * @category Observability
 */
export function identifyLearner(accountId: string): void {
  if (hasConsent()) client?.identify(accountId);
}

/**
 * Ends the identity on this device once nobody is signed in, so the next
 * person to use it is not taken for the learner who left.
 *
 * @remarks
 * Safe to call on every signed-out page: it acts only while PostHog still
 * holds an identified learner, which is the case after a sign-out, an account
 * deletion or an expired session. An anonymous visitor keeps the identity they
 * had — resetting it on every page would turn one visit into many.
 *
 * The SDK's `reset()` clears the consent answer along with the identity. The
 * answer belongs to the device, not to the account, so it is put back —
 * without the event an acceptance normally sends, since nobody accepted
 * anything just now.
 *
 * @category Observability
 */
export function forgetLearner(): void {
  if (!client || !isIdentified(client)) return;
  client.reset();
  client.opt_in_capturing({ captureEventName: false });
  publishConsent();
}

/**
 * Starts recording the session, if the visitor accepted.
 *
 * @category Observability
 */
export function startRecording(): void {
  if (hasConsent()) client?.startSessionRecording();
}

/**
 * Stops recording the session.
 *
 * @category Observability
 */
export function stopRecording(): void {
  client?.stopSessionRecording();
}

// `$user_state` is where the SDK records that `identify()` was called; it is
// what its own `_isIdentified()` reads. Only a consenting visitor can be
// identified, so an identified client is always one that had opted in.
function isIdentified(started: ProductAnalyticsClient): boolean {
  return started.get_property("$user_state") === "identified";
}

function hasConsent(): boolean {
  return consentStatus() === "granted";
}

function publishConsent(): void {
  if (!client) return;
  consentStore.setState({ status: client.get_explicit_consent_status(), isReconsidering: false });
}
