// @vitest-environment node
import { reportHandledError } from "@/lib/report-handled-error/report-handled-error";

import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PostHogUsageDataEraser } from "./posthog-usage-data-eraser";

vi.mock("@/lib/report-handled-error/report-handled-error", () => ({
  reportHandledError: vi.fn(),
}));

/**
 * Guards the `product-analytics` capability's "Deleting an account erases its
 * usage data".
 *
 * `fetch` is stubbed: PostHog's private API cannot be run in a container, and
 * what is under test is which two requests are made, with what, and what each
 * possible answer becomes.
 */

const fetchStub = vi.fn<typeof fetch>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function anEraser() {
  const settings = {
    projectId: String(faker.number.int({ min: 1000, max: 99999 })),
    personalApiKey: `phx_${faker.string.alphanumeric(40)}`,
  };
  return { eraser: new PostHogUsageDataEraser(settings), ...settings };
}

function requestNumber(index: number): { url: string; init: RequestInit | undefined } {
  const [url, init] = fetchStub.mock.calls[index] ?? [];
  return { url: String(url), init };
}

describe("PostHogUsageDataEraser", () => {
  beforeEach(() => {
    fetchStub.mockReset();
    vi.stubGlobal("fetch", fetchStub);
    vi.mocked(reportHandledError).mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());

  test("WHEN PostHog holds a person for the account THEN it is deleted with its events and recordings", async () => {
    const { eraser, projectId, personalApiKey } = anEraser();
    const accountId = faker.string.alphanumeric(32);
    const personUuid = faker.string.uuid();
    fetchStub
      .mockResolvedValueOnce(json({ results: [{ uuid: personUuid }] }))
      .mockResolvedValueOnce(json({}, 202));

    const result = await eraser.erase(accountId);

    expect(result.isOk()).toBe(true);
    const lookup = requestNumber(0);
    expect(lookup.url).toBe(
      `https://us.posthog.com/api/projects/${projectId}/persons/?distinct_id=${accountId}`,
    );
    expect(lookup.init?.headers).toEqual({ Authorization: `Bearer ${personalApiKey}` });
    const deletion = requestNumber(1);
    expect(deletion.url).toBe(
      `https://us.posthog.com/api/projects/${projectId}/persons/${personUuid}/?delete_events=true&delete_recordings=true`,
    );
    expect(deletion.init).toMatchObject({
      method: "DELETE",
      headers: { Authorization: `Bearer ${personalApiKey}` },
    });
  });

  test("WHEN the learner never consented THEN there is nobody to delete, and that is success", async () => {
    const { eraser } = anEraser();
    fetchStub.mockResolvedValueOnce(json({ results: [] }));

    const result = await eraser.erase(faker.string.alphanumeric(32));

    expect(result.isOk()).toBe(true);
    expect(fetchStub).toHaveBeenCalledOnce();
    expect(reportHandledError).not.toHaveBeenCalled();
  });

  test("WHEN PostHog refuses the lookup THEN the erasure fails and is reported by account ID", async () => {
    const { eraser, personalApiKey } = anEraser();
    const accountId = faker.string.alphanumeric(32);
    fetchStub.mockResolvedValueOnce(json({ detail: "Invalid API key" }, 401));

    const result = await eraser.erase(accountId);

    expect(result.isErr()).toBe(true);
    expect(reportHandledError).toHaveBeenCalledExactlyOnceWith(expect.any(Error), {
      where: "posthog-usage-data-eraser",
      accountId,
    });
    expect(JSON.stringify(vi.mocked(reportHandledError).mock.calls)).not.toContain(personalApiKey);
  });

  test("WHEN PostHog refuses the deletion THEN the erasure fails and is reported", async () => {
    const { eraser } = anEraser();
    fetchStub
      .mockResolvedValueOnce(json({ results: [{ uuid: faker.string.uuid() }] }))
      .mockResolvedValueOnce(json({}, 500));

    const result = await eraser.erase(faker.string.alphanumeric(32));

    expect(result.isErr()).toBe(true);
    expect(reportHandledError).toHaveBeenCalledOnce();
  });

  test("WHEN PostHog cannot be reached THEN the erasure fails instead of throwing", async () => {
    const { eraser } = anEraser();
    fetchStub.mockRejectedValueOnce(new TypeError("fetch failed"));

    const result = await eraser.erase(faker.string.alphanumeric(32));

    expect(result.isErr()).toBe(true);
    expect(reportHandledError).toHaveBeenCalledOnce();
  });

  test("WHEN PostHog answers with something unexpected THEN nothing is deleted on a guess", async () => {
    const { eraser } = anEraser();
    fetchStub.mockResolvedValueOnce(json({ unexpected: true }));

    const result = await eraser.erase(faker.string.alphanumeric(32));

    expect(result.isErr()).toBe(true);
    expect(fetchStub).toHaveBeenCalledOnce();
  });
});
