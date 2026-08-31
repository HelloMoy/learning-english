import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { RememberContinueWatching } from "./remember-continue-watching";

const COURSE_SLUG = "english-a1-pronunciation";
const MODULE_SLUG = "vowels-and-video-intro";
const LESSON_ID = "33333333-3333-4333-8333-333333333333";

/** A `ContinueWatchingRepository` over one nullable slot. */
function makeRepository(): ContinueWatchingRepository & { stored: () => unknown } {
  let stored: ContinueWatchingLocation | null = null;
  return {
    get: async () => stored,
    set: async (location) => {
      stored = location;
    },
    stored: () => stored,
  };
}

const renderMarker = (
  repository: ContinueWatchingRepository,
  overrides?: { courseSlug?: string; moduleSlug?: string; lessonId?: string },
) =>
  render(
    <RememberContinueWatching
      courseSlug={overrides?.courseSlug ?? COURSE_SLUG}
      moduleSlug={overrides?.moduleSlug ?? MODULE_SLUG}
      lessonId={overrides?.lessonId ?? LESSON_ID}
      continueWatching={repository}
    />,
  );

describe("RememberContinueWatching", () => {
  test("records the current lesson's location on mount", async () => {
    // Arrange
    const repository = makeRepository();

    // Act
    renderMarker(repository);

    // Assert
    await waitFor(() =>
      expect(repository.stored()).toEqual({
        courseSlug: COURSE_SLUG,
        moduleSlug: MODULE_SLUG,
        lessonId: LESSON_ID,
      }),
    );
  });

  test("renders nothing into the page", async () => {
    // Arrange
    const repository = makeRepository();

    // Act
    const { container } = renderMarker(repository);

    // Assert
    await waitFor(() => expect(repository.stored()).not.toBeNull());
    expect(container).toBeEmptyDOMElement();
  });

  test("records once per lesson, not once per render", async () => {
    // Arrange
    // The write is cheap but not free, and re-running it on every paint would
    // make the record depend on React's render cadence.
    const repository = makeRepository();
    const write = vi.spyOn(repository, "set");
    const { rerender } = renderMarker(repository);
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));

    // Act
    rerender(
      <RememberContinueWatching
        courseSlug={COURSE_SLUG}
        moduleSlug={MODULE_SLUG}
        lessonId={LESSON_ID}
        continueWatching={repository}
      />,
    );

    // Assert
    expect(write).toHaveBeenCalledTimes(1);
  });

  test("does not write when the route segments are malformed", async () => {
    // Arrange
    // A route param that failed to parse upstream must not poison the store;
    // the value object is the gate.
    const repository = makeRepository();
    const write = vi.spyOn(repository, "set");

    // Act
    renderMarker(repository, { lessonId: "not-a-uuid" });

    // Assert
    await waitFor(() => expect(write).not.toHaveBeenCalled());
    expect(repository.stored()).toBeNull();
  });

  test("does not break the page when the write is rejected", async () => {
    // Arrange
    const repository = makeRepository();
    vi.spyOn(repository, "set").mockRejectedValue(new Error("storage blocked"));

    // Act + Assert
    expect(() => renderMarker(repository)).not.toThrow();
  });
});
