import { expect, type Page } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

type MailpitSummary = { ID: string; To: ReadonlyArray<{ Address: string }> };

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

async function newestAuthLink(page: Page, address: string): Promise<string | undefined> {
  const list = (await (await page.request.get(`${MAILPIT_URL}/api/v1/messages`)).json()) as {
    messages: MailpitSummary[];
  };
  const message = list.messages.find((summary) =>
    summary.To.some((recipient) => recipient.Address === address),
  );
  if (!message) return undefined;
  const detail = (await (
    await page.request.get(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
  ).json()) as { Text: string };
  return detail.Text.match(AUTH_LINK)?.[0];
}
