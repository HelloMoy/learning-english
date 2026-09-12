import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LessonVideoSkeleton } from "./lesson-video-skeleton";

const placeholder = (): HTMLElement | null =>
  document.querySelector('[data-testid="lesson-video-skeleton"]');

/** The full-frame shimmer, as distinct from the shapes inside the control bar. */
const shimmerFill = (): HTMLElement | null =>
  document.querySelector('[data-testid="lesson-video-skeleton-fill"]');

describe("LessonVideoSkeleton", () => {
  describe("GIVEN a lesson that declares a poster", () => {
    test("WHEN the placeholder renders THEN it shows that poster inside the frame", () => {
      // Arrange
      const poster = `/local-filesystem-lesson/${faker.system.fileName({ extensionCount: 0 })}/thumbnail.jpeg`;

      // Act
      render(<LessonVideoSkeleton poster={poster} />);

      // Assert
      const image = document.querySelector("img");
      expect(image).toHaveAttribute("src", poster);
    });

    test("WHEN the placeholder renders THEN no shimmer fill competes with the poster", () => {
      // Arrange
      const poster = faker.image.url();

      // Act
      render(<LessonVideoSkeleton poster={poster} />);

      // Assert
      expect(shimmerFill()).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a lesson with no poster", () => {
    test("WHEN the placeholder renders THEN a shimmer fills the frame instead", () => {
      // Act
      render(<LessonVideoSkeleton />);

      // Assert
      expect(shimmerFill()).toBeInTheDocument();
      expect(document.querySelector("img")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN either shape", () => {
    test("WHEN the placeholder renders THEN it is legible as a player, not a still image", () => {
      // Act
      render(<LessonVideoSkeleton poster={faker.image.url()} />);

      // Assert
      expect(
        document.querySelector('[data-testid="lesson-video-skeleton-play"]'),
      ).toBeInTheDocument();
      expect(
        document.querySelector('[data-testid="lesson-video-skeleton-controls"]'),
      ).toBeInTheDocument();
    });

    test("WHEN the placeholder renders THEN it is hidden from assistive technology", () => {
      // Act
      render(<LessonVideoSkeleton />);

      // Assert
      // The player beside it already carries the region's accessible name; a
      // second voice on the same frame would announce the lesson twice.
      expect(placeholder()).toHaveAttribute("aria-hidden", "true");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    test("WHEN the placeholder renders THEN nothing in it can be focused or clicked", () => {
      // Act
      render(<LessonVideoSkeleton poster={faker.image.url()} />);

      // Assert
      // It sits over a live player: a pointer target here would swallow the tap
      // that is meant to start playback the moment the player is ready.
      expect(placeholder()).toHaveClass("pointer-events-none");
      expect(placeholder()?.querySelectorAll("button, a, input, [tabindex]")).toHaveLength(0);
    });
  });
});
