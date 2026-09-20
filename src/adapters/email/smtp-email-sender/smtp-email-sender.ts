import "server-only";

import { reportHandledError } from "@/lib/report-handled-error/report-handled-error";

import { ResultAsync } from "neverthrow";
import nodemailer, { type Transporter } from "nodemailer";

import type { EmailDeliveryError, EmailMessage, EmailSender } from "../email-sender";

/**
 * Where and as whom to send: the SMTP server, its credentials, and the
 * `From` header every message carries.
 *
 * @category Email
 */
export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
};

/**
 * Sends email over SMTP with nodemailer.
 *
 * @remarks
 * The one transport the application uses, in every environment: Mailpit in
 * development, Resend's SMTP relay (`smtp.resend.com:465`) in production. Only
 * the settings differ, so the production path is the path that runs locally.
 *
 * @example
 * ```ts
 * const sender = new SmtpEmailSender({ host: "127.0.0.1", port: 1025, secure: false, from });
 * await sender.send({ to, subject, html, text });
 * ```
 */
export class SmtpEmailSender implements EmailSender {
  readonly #transport: Transporter;
  readonly #from: string;

  constructor(settings: SmtpSettings) {
    this.#transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.user ? { user: settings.user, pass: settings.password } : undefined,
    });
    this.#from = settings.from;
  }

  send(message: EmailMessage): ResultAsync<void, EmailDeliveryError> {
    return ResultAsync.fromPromise(
      this.#transport.sendMail({ from: this.#from, ...message }),
      (cause): EmailDeliveryError => {
        void reportHandledError(cause, { where: "smtp-email-sender" });
        return { kind: "email-delivery-failed", cause };
      },
    ).map(() => undefined);
  }
}
