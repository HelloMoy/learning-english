import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockAction = vi.fn();

vi.mock("./actions", () => ({
  findContinueWatchingAction: (...args: unknown[]) => mockAction(...args),
}));

const { resolveContinueWatchingPanel } = await import("./resolve-continue-watching");

const location = ContinueWatchingLocation.parse({
  courseSlug: faker.lorem.slug(),
  moduleSlug: faker.lorem.slug(),
  lessonId: faker.string.uuid(),
});

const panel = {
  courseTitle: faker.lorem.words(2),
  moduleTitle: faker.lorem.words(2),
  lessonTitle: faker.lorem.words(3),
  lessonHref: `/courses/${location.courseSlug}`,
  durationSeconds: faker.number.int({ min: 60, max: 3600 }),
};

describe("resolveContinueWatchingPanel", () => {
  beforeEach(() => {
    mockAction.mockReset();
  });

  test("passes the stored location straight to the action", async () => {
    mockAction.mockResolvedValue({ data: panel });
    await resolveContinueWatchingPanel(location);
    expect(mockAction).toHaveBeenCalledWith(location);
  });

  test("unwraps the panel the action resolved", async () => {
    mockAction.mockResolvedValue({ data: panel });
    await expect(resolveContinueWatchingPanel(location)).resolves.toEqual(panel);
  });

  /**
   * Every failure collapses to the same answer, because every caller's
   * response to it is the same: render the state that claims nothing.
   */
  test.each([
    ["a location that no longer resolves", { data: null }],
    ["input the schema rejected", { validationErrors: { _errors: ["bad"] } }],
    ["a body that threw", { serverError: "boom" }],
    ["no envelope at all", undefined],
  ])("answers null for %s", async (_case, result) => {
    mockAction.mockResolvedValue(result);
    await expect(resolveContinueWatchingPanel(location)).resolves.toBeNull();
  });
});
