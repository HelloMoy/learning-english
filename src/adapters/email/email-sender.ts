import type { ResultAsync } from "neverthrow";

/**
 * One email, fully rendered: the sender adds nothing but transport.
 *
 * `text` is the plain-text alternative sent beside `html`, for clients that
 * do not render HTML and for spam filters that penalise HTML-only mail.
 *
 * @category Email
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Why a message did not go out. `cause` carries the transport's own error for
 * logs; it is never shown to a learner.
 *
 * @category Email
 */
export type EmailDeliveryError = {
  kind: "email-delivery-failed";
  cause: unknown;
};

/**
 * Driven-adapter primitive: hands a rendered message to a mail transport.
 *
 * Not a domain port — nothing in `src/domain/**` sends email. It exists so
 * the auth callbacks can send through one interface whatever the transport,
 * and so tests can inject a recording sender.
 *
 * @category Email
 */
export interface EmailSender {
  /** Resolves `Ok` once the transport accepted the message, `Err` otherwise. */
  send(message: EmailMessage): ResultAsync<void, EmailDeliveryError>;
}
