import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";

/** The Mailpit image the email suites run; `compose.yaml` pins the same tag. */
export const MAILPIT_IMAGE = "axllent/mailpit:v1.31.1";

const SMTP_PORT = 1025;
const API_PORT = 8025;

/** What a suite needs to know about one received message. */
export type ReceivedMessage = {
  subject: string;
  html: string;
  text: string;
};

/** A running Mailpit: where to send, and how to read back what arrived. */
export type StartedMailpit = {
  smtpHost: string;
  smtpPort: number;
  apiUrl: string;
  latestMessageTo: (address: string) => Promise<ReceivedMessage>;
  stop: () => Promise<void>;
};

type MessageSummary = { ID: string; To: ReadonlyArray<{ Address: string }> };
type MessageDetail = { Subject: string; HTML: string; Text: string };

/**
 * Starts a Mailpit container: an SMTP server that accepts any recipient and
 * exposes what it received over HTTP.
 *
 * @returns Its SMTP endpoint, its API URL and a reader for received mail
 */
export async function startMailpitContainer(): Promise<StartedMailpit> {
  const container = await new GenericContainer(MAILPIT_IMAGE)
    .withExposedPorts(SMTP_PORT, API_PORT)
    .withWaitStrategy(Wait.forHttp("/api/v1/info", API_PORT))
    .start();
  const apiUrl = `http://${container.getHost()}:${container.getMappedPort(API_PORT)}`;

  return {
    smtpHost: container.getHost(),
    smtpPort: container.getMappedPort(SMTP_PORT),
    apiUrl,
    latestMessageTo: (address) => latestMessageTo(apiUrl, address),
    stop: () => stopContainer(container),
  };
}

/**
 * Reads the newest message Mailpit holds for an address.
 *
 * @param apiUrl - Mailpit's HTTP origin
 * @param address - The recipient to look for
 * @throws Error when no message for that address has arrived
 */
export async function latestMessageTo(apiUrl: string, address: string): Promise<ReceivedMessage> {
  const list = await getJson<{ messages: MessageSummary[] }>(`${apiUrl}/api/v1/messages`);
  const summary = list.messages.find((message) =>
    message.To.some((recipient) => recipient.Address.toLowerCase() === address.toLowerCase()),
  );
  if (!summary) throw new Error(`Mailpit holds no message for ${address}`);

  const detail = await getJson<MessageDetail>(`${apiUrl}/api/v1/message/${summary.ID}`);
  return { subject: detail.Subject, html: detail.HTML, text: detail.Text };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return (await response.json()) as T;
}

async function stopContainer(container: StartedTestContainer): Promise<void> {
  await container.stop();
}
