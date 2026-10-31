import { stubElementGeometry, type ElementGeometryStub } from "@/test-setup/stubs/element-geometry";

import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import messages from "../../../messages/en.json";
import {
  makeCourseFixture,
  seedCompletedLessons,
  type CourseFixture,
} from "../outline-drawer/outline-drawer-fixture";
import { Outline } from "./outline";

/**
 * The gate under test, not the hook: a plain RTL `render()` is a client render
 * rather than a hydration pass, so the real `useIsHydrated` returns `true` on
 * its first call and leaves no un-hydrated frame to observe.
 */
let isHydrated = true;
vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: () => isHydrated,
}));

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

/**
 * The real messages, not a mock that echoes keys: the summary states an ICU
 * message with four interpolated counts.
 */
const renderOutline = (fixture: CourseFixture, { showHeading = true } = {}) =>
  render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      <Outline
        {...fixture.props}
        showHeading={showHeading}
      />
    </NextIntlClientProvider>,
  );

/** Two lessons of 4 and 6 videos: the first finished, one video into the second. */
const halfwayFixture = () => {
  const fixture = makeCourseFixture({ lessonsPerModule: [4, 6], currentModuleIndex: 1 });
  seedCompletedLessons(fixture.lessons.slice(0, 5));
  announceStorageChange();
  return fixture;
};

describe("Outline", () => {
  let geometry: ElementGeometryStub;

  beforeEach(() => {
    isHydrated = true;
    window.localStorage.clear();
    announceStorageChange();
    geometry = stubElementGeometry();
  });

  afterEach(() => {
    geometry.restore();
  });

  test("WHEN rendered THEN it shows the outline heading and the current module's lessons", () => {
    // Act
    renderOutline(makeCourseFixture({ lessonsPerModule: [2] }));

    // Assert
    expect(screen.getByRole("heading", { name: "Course outline" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Course outline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Consonants" })).toBeInTheDocument();
    expect(screen.getByText("Lesson 1.2")).toBeInTheDocument();
  });

  test("WHEN the outline is scrolled THEN its heading stays pinned to the top of the region", () => {
    // Act
    renderOutline(makeCourseFixture({ lessonsPerModule: [2] }));

    // Assert — the shell bounds the outline and scrolls it to the current
    // lesson, which would carry the heading out of sight. Pinning it keeps
    // the sidebar labelled; the opaque background stops rows showing
    // through. Class assertions, as elsewhere for layout-only concerns.
    const heading = screen.getByRole("heading", { name: "Course outline" });
    expect(heading).toHaveClass("sticky");
    expect(heading).toHaveClass("top-0");
    expect(heading).toHaveClass("bg-card");
  });

  test("WHEN the shell already names the region THEN the outline renders no second heading", () => {
    // Act — `showHeading={false}` is how a shell whose own control already
    // says "Course outline" (the mobile drawer's <summary>) avoids showing
    // the same words twice.
    renderOutline(makeCourseFixture({ lessonsPerModule: [2] }), { showHeading: false });

    // Assert — the visible heading is gone, but the region keeps its
    // accessible name, so assistive technology loses nothing.
    expect(screen.queryByRole("heading", { name: "Course outline" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Course outline" })).toBeInTheDocument();
  });

  describe("GIVEN the course summary", () => {
    test("WHEN the learner is part way through THEN it states the share, the videos and the lessons", () => {
      // Act
      renderOutline(halfwayFixture());

      // Assert
      expect(screen.getByTestId("outline-summary-percent")).toHaveTextContent("50%");
      expect(screen.getByText("5 of 10 videos · 1 of 2 lessons completed")).toBeInTheDocument();
      expect(screen.getByTestId("outline-summary-fill")).toHaveStyle({ width: "50%" });
    });

    test("WHEN the learner has completed nothing THEN it states the course's size and no share", () => {
      // Act
      renderOutline(makeCourseFixture({ lessonsPerModule: [4, 6] }));

      // Assert — "0%" would be a claim about the learner; the size is not.
      expect(screen.getByText("10 videos · 2 lessons")).toBeInTheDocument();
      expect(screen.queryByTestId("outline-summary-percent")).toBeNull();
      expect(screen.queryByTestId("outline-summary-fill")).toBeNull();
    });

    test("WHEN the shell provides the heading THEN the summary still renders", () => {
      // Act
      renderOutline(halfwayFixture(), { showHeading: false });

      // Assert
      expect(screen.getByText("5 of 10 videos · 1 of 2 lessons completed")).toBeInTheDocument();
    });
  });

  describe("GIVEN the lesson rows", () => {
    test("WHEN the learner has progress THEN each row states its own share", () => {
      // Act
      renderOutline(halfwayFixture());

      // Assert — the rows count through the same tally as the summary.
      expect(screen.getByRole("button", { name: "Module 1" })).toHaveAccessibleDescription(
        "Lesson completed",
      );
      expect(screen.getByRole("button", { name: "Consonants" })).toHaveAccessibleDescription(
        "1 / 6 videos · 17%",
      );
    });
  });

  describe("GIVEN the first frame cannot know the learner's progress", () => {
    test("WHEN it renders before hydration THEN no share is claimed anywhere", () => {
      // Arrange
      isHydrated = false;

      // Act
      renderOutline(halfwayFixture());

      // Assert — stored progress exists, but the page may not state it yet.
      expect(screen.getByText("10 videos · 2 lessons")).toBeInTheDocument();
      expect(screen.queryByTestId("outline-summary-percent")).toBeNull();
      expect(screen.getByRole("button", { name: "Module 1" })).toHaveAccessibleDescription(
        "4 videos",
      );
      expect(screen.queryAllByTestId("completion-ring-fill")).toHaveLength(0);
    });
  });
});
