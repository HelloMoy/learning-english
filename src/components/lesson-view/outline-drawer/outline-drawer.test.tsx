import type { LessonId } from "@/domain/entities/ids/ids";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { stubElementGeometry, type ElementGeometryStub } from "@/test-setup/stubs/element-geometry";

import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import messages from "../../../messages/en.json";
import { OutlineDrawer } from "./outline-drawer";
import { makeCourseFixture, type CourseFixture } from "./outline-drawer-fixture";

/**
 * The gate under test, not the hook: a plain RTL `render()` is a client render
 * rather than a hydration pass, so the real `useIsHydrated` returns `true` on
 * its first call and leaves no un-hydrated frame to observe. The hook's own
 * behavior has `use-is-hydrated.test.ts`.
 */
let isHydrated = true;
vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: () => isHydrated,
}));

const markCompleteInStorage = (lessonId: LessonId): void => {
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
};

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

/**
 * The real messages, not a mock that echoes keys: the row states an ICU message
 * with three interpolated values, and asserting on "positionLabel" would prove
 * only that a key reached the formatter.
 */
const renderDrawer = (fixture: CourseFixture) =>
  render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      <OutlineDrawer {...fixture.props} />
    </NextIntlClientProvider>,
  );

/** A course whose current lesson is the 13th of 27 in the module "Consonants". */
const consonantsFixture = () =>
  makeCourseFixture({
    lessonsPerModule: [4, 27],
    currentModuleIndex: 1,
    currentLessonIndex: 12,
  });

describe("OutlineDrawer", () => {
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

  describe("GIVEN the mobile row", () => {
    test("WHEN it renders THEN it names the region and states the position in the module", () => {
      renderDrawer(consonantsFixture());

      const row = screen.getByTestId("outline-drawer-row");
      expect(within(row).getByText("Course outline")).toBeInTheDocument();
      expect(within(row).getByText("Consonants · Lesson 13 of 27")).toBeInTheDocument();
    });

    test("WHEN it renders THEN it is collapsed", () => {
      const { container } = renderDrawer(consonantsFixture());

      // A closed <details> keeps its contents in the DOM — the browser hides
      // them from sight and from assistive technology, and jsdom emulates
      // neither — so the honest assertion is on the disclosure's own state.
      expect(container.querySelector("details")?.open).toBe(false);
      expect(screen.getByTestId("outline-drawer-row")).toHaveAttribute("aria-expanded", "false");
    });

    test("WHEN the current lesson is not in the course THEN no position is invented", () => {
      const fixture = makeCourseFixture({ lessonsPerModule: [4] });
      const strayLessonId = makeCourseFixture({ lessonsPerModule: [1] }).currentLesson.id;

      renderDrawer({
        ...fixture,
        props: { ...fixture.props, currentLessonId: strayLessonId },
      });

      const row = screen.getByTestId("outline-drawer-row");
      expect(within(row).getByText("Course outline")).toBeInTheDocument();
      expect(within(row).queryByText(/Lesson \d+ of/)).toBeNull();
    });
  });

  describe("GIVEN the row is the card's only tap target", () => {
    test("WHEN the card renders THEN the tile and the chevron are not separately focusable", () => {
      renderDrawer(makeCourseFixture({ lessonsPerModule: [4] }));

      const row = screen.getByTestId("outline-drawer-row");
      expect(row.tagName).toBe("SUMMARY");
      expect(within(row).queryAllByRole("button")).toHaveLength(0);
      expect(within(row).queryAllByRole("link")).toHaveLength(0);
      expect(row.querySelectorAll("[tabindex]")).toHaveLength(0);
    });

    test("WHEN the row is activated anywhere along its width THEN the outline expands", async () => {
      const user = userEvent.setup();
      const { container } = renderDrawer(consonantsFixture());

      await user.click(screen.getByText("Consonants · Lesson 13 of 27"));

      // Both branches render, so the assertion is scoped to the mobile one.
      // The current lesson's row carries its own aria-label, so a sibling row
      // is what proves the list itself arrived.
      const drawer = container.querySelector("details")!;
      expect(drawer.open).toBe(true);
      expect(within(drawer).getByRole("link", { name: "Lesson 2.1" })).toBeInTheDocument();
    });
  });

  describe("GIVEN the chevron indicates the state", () => {
    test("WHEN the row expands THEN state travels by aria-expanded and the icon stays decorative", async () => {
      const user = userEvent.setup();
      renderDrawer(makeCourseFixture({ lessonsPerModule: [4] }));
      const row = screen.getByTestId("outline-drawer-row");

      expect(screen.getByTestId("outline-chevron")).toHaveAttribute("aria-hidden", "true");

      await user.click(row);

      expect(row).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByTestId("outline-chevron")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("GIVEN the outline expands", () => {
    test("WHEN it opens THEN it positions the current lesson into view", async () => {
      const user = userEvent.setup();
      const { container } = renderDrawer(consonantsFixture());
      const writesBeforeOpening = geometry.scrollTopWrites.length;

      await user.click(screen.getByTestId("outline-drawer-row"));

      const writesWhileOpening = geometry.scrollTopWrites.slice(writesBeforeOpening);
      expect(writesWhileOpening).toHaveLength(1);
      expect(container.querySelector("details")?.contains(writesWhileOpening[0]!.element)).toBe(
        true,
      );
    });

    test("WHEN it opens THEN the region is not named twice", async () => {
      const user = userEvent.setup();
      const { container } = renderDrawer(makeCourseFixture({ lessonsPerModule: [4] }));

      await user.click(screen.getByTestId("outline-drawer-row"));

      // The row's own title already names the region, so the outline inside it
      // adds no heading. The desktop sidebar, which has no such row, keeps one.
      const drawer = within(container.querySelector("details")!);
      expect(drawer.queryByRole("heading", { name: "Course outline" })).toBeNull();
      expect(drawer.getByRole("navigation", { name: "Course outline" })).toBeInTheDocument();
    });
  });

  describe("GIVEN the edge meter tracks the course", () => {
    test("WHEN the learner is part way through THEN the meter is filled to that share", () => {
      const fixture = makeCourseFixture({ lessonsPerModule: [4, 6] });
      for (const lesson of fixture.lessons.slice(0, 5)) markCompleteInStorage(lesson.id);
      announceStorageChange();

      renderDrawer(fixture);

      const meter = within(screen.getByTestId("outline-drawer-row")).getByRole("progressbar");
      expect(meter).toHaveAccessibleName("50% of the course completed");
      expect(screen.getByTestId("outline-meter-fill")).toHaveStyle({ width: "50%" });
    });

    test("WHEN nothing is complete THEN the track draws and no reading is claimed", () => {
      renderDrawer(makeCourseFixture({ lessonsPerModule: [4, 6] }));

      const row = screen.getByTestId("outline-drawer-row");
      expect(screen.getByTestId("outline-meter-fill")).toHaveStyle({ width: "0%" });
      expect(within(row).queryByRole("progressbar")).toBeNull();
    });

    test("WHEN the row is expanded THEN the meter agrees with the marks it opens onto", async () => {
      // The meter and the marks must never disagree: both count through
      // `countsAsComplete`. Nothing but this test crosses the two, so a meter
      // that grew its own arithmetic would otherwise pass unnoticed.
      const user = userEvent.setup();
      const fixture = makeCourseFixture({ lessonsPerModule: [6, 4] });
      const completedInFirstModule = fixture.lessons.slice(0, 4);
      for (const lesson of completedInFirstModule) markCompleteInStorage(lesson.id);
      announceStorageChange();
      const { container } = renderDrawer(fixture);

      await user.click(screen.getByTestId("outline-drawer-row"));

      const drawer = within(container.querySelector("details")!);
      expect(drawer.getAllByTestId("lesson-completion-mark")).toHaveLength(
        completedInFirstModule.length,
      );
      expect(drawer.getByRole("progressbar", { name: /of the course completed/ })).toHaveAttribute(
        "aria-valuenow",
        String(Math.round((completedInFirstModule.length / fixture.lessons.length) * 100)),
      );
    });

    test("WHEN the row renders before hydration THEN the fill is empty", () => {
      isHydrated = false;
      const fixture = makeCourseFixture({ lessonsPerModule: [4, 6] });
      for (const lesson of fixture.lessons.slice(0, 5)) markCompleteInStorage(lesson.id);
      announceStorageChange();

      renderDrawer(fixture);

      expect(screen.getByTestId("outline-meter-fill")).toHaveStyle({ width: "0%" });
      expect(
        within(screen.getByTestId("outline-drawer-row")).queryByRole("progressbar"),
      ).toBeNull();
    });
  });

  describe("GIVEN the desktop sidebar", () => {
    test("WHEN rendered THEN it is wrapped in a hidden <aside> beside the mobile row", () => {
      // Class assertions are stable enough for this layout-only concern.
      const { container } = renderDrawer(makeCourseFixture({ lessonsPerModule: [4] }));

      expect(container.querySelector("aside.hidden.lg\\:flex")).toBeInTheDocument();
      expect(container.querySelector("details.lg\\:hidden")).toBeInTheDocument();
    });

    test("WHEN rendered THEN it is sticky and bounded, and scrolls one level in", () => {
      const { container } = renderDrawer(makeCourseFixture({ lessonsPerModule: [4] }));

      // The sidebar sticks below the header and bounds its height, while the
      // scrolling happens in an unpadded region inside it so nothing can scroll
      // through the card's padding above the outline's pinned heading.
      const desktopAside = container.querySelector("aside");
      expect(desktopAside).toHaveClass("sticky");
      expect(desktopAside?.className).toMatch(/max-h-\[/);
      expect(desktopAside).not.toHaveClass("overflow-y-auto");
      expect(desktopAside?.querySelector(".overflow-y-auto")).toBeInTheDocument();
    });

    test("WHEN rendered THEN it scrolls the current lesson into its own view", () => {
      const { container } = renderDrawer(makeCourseFixture({ lessonsPerModule: [4] }));

      // Exactly one region positions itself on mount, and it is the sidebar's
      // scroll region. The offset itself is jsdom's zero; the arithmetic has
      // its own unit test.
      expect(geometry.scrollTopWrites).toHaveLength(1);
      expect(geometry.scrollTopWrites[0]?.element).toBe(
        container.querySelector("aside .overflow-y-auto"),
      );
    });
  });
});
