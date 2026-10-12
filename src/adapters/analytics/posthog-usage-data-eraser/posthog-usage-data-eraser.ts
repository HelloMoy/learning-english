import "server-only";

import { reportHandledError } from "@/lib/report-handled-error/report-handled-error";

import { ResultAsync } from "neverthrow";
import { z } from "zod";

import type { UsageDataEraser, UsageDataErasureError } from "../usage-data-eraser";

// PostHog's private API for US projects. A constant, like the ingestion hosts:
// the privacy policy says where the data lives.
const POSTHOG_API = "https://us.posthog.com";

const personList = z.object({ results: z.array(z.object({ uuid: z.string().min(1) })) });

/**
 * What the eraser needs to speak to PostHog's private API.
 *
 * @category Observability
 */
export type PostHogApiSettings = {
  /** The numeric ID of the PostHog project. */
  projectId: string;
  /** A personal API key scoped to reading and deleting persons. A secret: server-only. */
  personalApiKey: string;
};

/**
 * Erases an account's usage data from PostHog: the person identified by the
 * account ID, their events, and their session recordings.
 *
 * @remarks
 * Two requests, because PostHog deletes a person by its own UUID and the
 * application only knows the account ID it identified them with: a lookup by
 * distinct ID, then a deletion with `delete_events` and `delete_recordings`.
 *
 * Finding nobody is success. Most deleted accounts belong to someone who
 * declined the consent question, or never signed in after accepting it.
 *
 * A failure is reported to Sentry with the account ID, so the erasure can be
 * finished by hand, and returned as an `Err` — never thrown. The caller has
 * already deleted the account, and an analytics outage must not undo that.
 *
 * @example
 * ```ts
 * const eraser = new PostHogUsageDataEraser({ projectId, personalApiKey });
 * const erased = await eraser.erase(user.id);
 * ```
 *
 * @category Observability
 */
export class PostHogUsageDataEraser implements UsageDataEraser {
  readonly #personsUrl: string;
  readonly #headers: { Authorization: string };

  constructor(settings: PostHogApiSettings) {
    this.#personsUrl = `${POSTHOG_API}/api/projects/${settings.projectId}/persons`;
    this.#headers = { Authorization: `Bearer ${settings.personalApiKey}` };
  }

  erase(accountId: string): ResultAsync<void, UsageDataErasureError> {
    return ResultAsync.fromPromise(
      this.#erasePeopleIdentifiedAs(accountId),
      (cause): UsageDataErasureError => {
        void reportHandledError(cause, { where: "posthog-usage-data-eraser", accountId });
        return { kind: "usage-data-erasure-failed", cause };
      },
    );
  }

  async #erasePeopleIdentifiedAs(accountId: string): Promise<void> {
    const personUuids = await this.#findPeople(accountId);
    await Promise.all(personUuids.map((uuid) => this.#deletePerson(uuid)));
  }

  async #findPeople(accountId: string): Promise<string[]> {
    const lookup = `${this.#personsUrl}/?distinct_id=${encodeURIComponent(accountId)}`;
    const response = await fetch(lookup, { headers: this.#headers });
    if (!response.ok) throw refusal("the person lookup", response);
    return personList.parse(await response.json()).results.map((person) => person.uuid);
  }

  async #deletePerson(uuid: string): Promise<void> {
    const deletion = `${this.#personsUrl}/${uuid}/?delete_events=true&delete_recordings=true`;
    const response = await fetch(deletion, { method: "DELETE", headers: this.#headers });
    if (!response.ok) throw refusal("the person deletion", response);
  }
}

function refusal(request: string, response: Response): Error {
  return new Error(`PostHog answered ${response.status} to ${request}`);
}
