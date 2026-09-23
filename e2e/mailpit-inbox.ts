import { expect, type Page } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

type MailpitSummary = { ID: string; Subject: string; To: ReadonlyArray<{ Address: string }> };

const AUTH_LINK = /https?:\/\/\S+\/api\/auth\/\S+/;

/**
 * The Better Auth link in the newest email to an address, read from the
 * Mailpit inbox `compose.yaml` runs. Polls until one arrives.
 *
 * @param page - Any page; only its request context is used
 * @param address - The recipient
 * @param action - The auth path the link must lead to, when several emails
 *   for the address may be waiting (`/delete-user/callback`)
 * @returns The link, as the learner would click it
 */
export async function authLinkMailedTo(page: Page, address: string, action = ""): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(async () => {
      link = await newestAuthLink(page, address);
      return link?.includes(`/api/auth${action}`) ? link : undefined;
    })
    .toBeTruthy();
  return link as string;
}

/**
 * The Better Auth link in the next email to an address, once it is not the one
 * the spec already holds. Polls until that newer email arrives.
 *
 * @remarks
 * An address that has already been mailed — every signed-up learner has a
 * verification email waiting — cannot be polled by "the newest link matching
 * this action": the stale one matches too, and the spec would open it before
 * the new one ever lands.
 *
 * @param page - Any page; only its request context is used
 * @param address - The recipient
 * @param previous - The link that address's newest email held before
 * @returns The newer link, as the learner would click it
 */
export async function nextAuthLinkMailedTo(
  page: Page,
  address: string,
  previous: string,
): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(async () => {
      link = await newestAuthLink(page, address);
      return link && link !== previous ? link : undefined;
    })
    .toBeTruthy();
  return link as string;
}

/**
 * The newest message waiting for an address, subject and plain text.
 *
 * @remarks
 * For a spec judging a message that carries no auth link — the
 * password-changed notice points at a page, not at `/api/auth/...` — so
 * `authLinkMailedTo` would never match it.
 *
 * @param page - Any page; only its request context is used
 * @param address - The recipient
 * @returns The newest message's subject and plain-text body
 */
export async function newestMessageTo(
  page: Page,
  address: string,
): Promise<{ subject: string; text: string }> {
  const summary = (await summariesFor(page)).find((message) => addressedTo(message, address));
  expect(summary, `Mailpit holds no message for ${address}`).toBeTruthy();
  const detail = (await (
    await page.request.get(`${MAILPIT_URL}/api/v1/message/${summary!.ID}`)
  ).json()) as { Text: string };
  return { subject: summary!.Subject, text: detail.Text };
}

/**
 * How many messages the Mailpit inbox holds for an address.
 *
 * @remarks
 * What a spec asserting that nothing was sent needs. It is not racing a send
 * in flight: the endpoints that decline to send decide before they answer, so
 * a count read after the page has shown its confirmation is a settled one.
 *
 * @param page - Any page; only its request context is used
 * @param address - The recipient
 * @returns The number of messages waiting for that address
 */
export async function messagesMailedTo(page: Page, address: string): Promise<number> {
  return (await summariesFor(page)).filter((summary) => addressedTo(summary, address)).length;
}

async function newestAuthLink(page: Page, address: string): Promise<string | undefined> {
  const message = (await summariesFor(page)).find((summary) => addressedTo(summary, address));
  if (!message) return undefined;
  const detail = (await (
    await page.request.get(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
  ).json()) as { Text: string };
  return detail.Text.match(AUTH_LINK)?.[0];
}

/** Mailpit answers newest first, which is what makes `find` mean "the latest". */
async function summariesFor(page: Page): Promise<MailpitSummary[]> {
  const list = (await (await page.request.get(`${MAILPIT_URL}/api/v1/messages`)).json()) as {
    messages: MailpitSummary[];
  };
  return list.messages;
}

function addressedTo(summary: MailpitSummary, address: string): boolean {
  return summary.To.some((recipient) => recipient.Address === address);
}
