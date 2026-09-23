/**
 * What was going on when a handled error happened: plain values only.
 *
 * @category Observability
 */
export type HandledErrorContext = Record<string, string | number | boolean>;

const BODY_KEYS = new Set(["body", "html", "text"]);
const EMAIL_ADDRESS = /[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+/g;

/**
 * Reports an error the application caught and recovered from, so it still
 * shows up in Sentry.
 *
 * @remarks
 * A no-op until Sentry is started, which only happens when a DSN is
 * configured: local development and tests send nothing. The SDK is imported
 * on the first report rather than with this module, because everything that
 * can fail imports this helper and most sessions never report anything. The context never
 * carries personal data out: message bodies (`body`, `html`, `text`) are
 * dropped and email addresses are replaced with `[email]`.
 *
 * @example
 * ```ts
 * void reportHandledError(sent.error.cause, { where: "smtp-email-sender" });
 * ```
 *
 * @param error - What was caught
 * @param context - Where it happened, as plain values
 * @returns Settles once the report is handed to Sentry, or skipped; callers
 *   need not wait for it
 */
export async function reportHandledError(
  error: unknown,
  context: HandledErrorContext,
): Promise<void> {
  const Sentry = await import("@sentry/nextjs");
  if (!Sentry.getClient()) return;
  Sentry.captureException(error, { extra: withoutPersonalData(context) });
}

function withoutPersonalData(context: HandledErrorContext): HandledErrorContext {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !BODY_KEYS.has(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.replace(EMAIL_ADDRESS, "[email]") : value,
      ]),
  );
}
