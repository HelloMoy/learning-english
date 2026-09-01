import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";
import type {
  LeadingLesson,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleShowcaseCard } from "./module-showcase-card";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

/**
 * A stand-in for `PlayButton`, so its absence can be asserted directly.
 *
 * The real decorative branch renders an unlabelled `aria-hidden` `<span>` with
 * no test id, which no accessible query can see. Querying its Tailwind classes
 * instead would couple this test to styling and pass for the wrong reason after
 * any restyle; the stand-in asserts the fact the requirement states — this card
 * does not render that component.
 */
vi.mock("@/components/play-button/play-button", () => ({
  PlayButton: () => <span data-testid="play-button-stand-in" />,
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
  sequence: 1,
});

const module3 = Module.parse({
  id: "22222222-2222-4222-8222-222222222222",
  courseId: course.id,
  slug: "3-contractions-reductions",
  title: "Contractions Reductions",
  sequence: 3,
});

const leadingLesson = (sequence: number, overrides?: Partial<LeadingLesson>): LeadingLesson => ({
  id: `33333333-3333-4333-8333-${String(sequence).padStart(12, "0")}` as LeadingLesson["id"],
  sequence,
  title: `Common English Expressions ${sequence}`,
  poster: `/local-filesystem-lesson/poster-${sequence}.jpeg`,
  ...overrides,
});

const summary = (overrides?: Partial<ModuleSummary>): ModuleSummary => ({
  moduleId: module3.id,
  lessonCount: 6,
  totalDurationSeconds: 3600,
  leadingLessons: [1, 2, 3, 4, 5, 6].map((sequence) => leadingLesson(sequence)),
  ...overrides,
});

/**
 * The string the key-echoing `useTranslations` mock produces for a message.
 *
 * Assertions build their expectations through this rather than hand-writing
 * them: the count line nests one message inside another, so the inner JSON
 * arrives back-slash escaped and is painful to write by hand correctly.
 */
const msg = (key: string, values?: Record<string, unknown>) =>
  values
    ? `CourseCatalog.courseOverview.${key}:${JSON.stringify(values)}`
    : `CourseCatalog.courseOverview.${key}`;

const metaText = (
  videoCount: number,
  durationKey: string,
  durationValues: Record<string, unknown>,
) =>
  msg("moduleMeta", {
    videos: msg("videoCount", { count: videoCount }),
    duration: msg(durationKey, durationValues),
  });

const renderCard = (moduleSummary: ModuleSummary = summary()) =>
  render(
    <ModuleShowcaseCard
      course={course}
      module={module3}
      summary={moduleSummary}
    />,
  );

describe("ModuleShowcaseCard", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(() => msg as never);
  });

  test("renders the module ordinal outside the framed panel", () => {
    renderCard();
    const ordinal = screen.getByTestId("module-showcase-ordinal");
    expect(ordinal).toHaveTextContent('moduleOrdinal:{"number":3}');
    // D4: the ordinal is a sibling of the panel, not a descendant of it, so
    // it never competes with a title for space inside the card.
    expect(
      within(screen.getByTestId("module-showcase-panel")).queryByTestId("module-showcase-ordinal"),
    ).toBeNull();
  });

  test("offers the call to action as the left panel's only playback affordance", () => {
    renderCard();
    expect(screen.getByTestId("module-showcase-cta")).toBeInTheDocument();
    expect(screen.queryByTestId("play-button-stand-in")).toBeNull();
  });

  test("states the video count and duration alongside the deck", () => {
    renderCard();
    // 3600s is exactly one hour, so the hours-only message is chosen.
    expect(screen.getByTestId("module-showcase-meta")).toHaveTextContent(
      metaText(6, "durationHours", { hours: 1 }),
    );
  });

  test("expresses a long module in hours and minutes rather than a minute count", () => {
    renderCard(summary({ lessonCount: 16, totalDurationSeconds: 38100 }));
    expect(screen.getByTestId("module-showcase-meta")).toHaveTextContent(
      metaText(16, "durationHoursMinutes", { hours: 10, minutes: 35 }),
    );
  });

  test("expresses a short module in minutes only", () => {
    renderCard(summary({ totalDurationSeconds: 1680 }));
    const meta = screen.getByTestId("module-showcase-meta");
    expect(meta).toHaveTextContent(metaText(6, "durationMinutes", { minutes: 28 }));
    expect(meta).not.toHaveTextContent("durationHours");
  });

  test("renders one card in the deck per leading lesson", () => {
    renderCard();
    expect(screen.getAllByTestId("module-showcase-card-in-deck")).toHaveLength(6);
  });

  test("recedes: every card narrower, darker, and further back than the last", () => {
    renderCard();
    const cards = screen.getAllByTestId("module-showcase-card-in-deck");
    const depth = cards.map((card) => ({
      // The flex grow ratio is what sizes each card — jsdom does no layout,
      // so the declared ratio is the thing to assert on.
      width: Number(card.style.flex.split(" ")[0]),
      z: Number(card.style.zIndex),
      shade: Number(card.querySelector<HTMLElement>("span[aria-hidden]")?.style.opacity ?? 0),
    }));
    for (let i = 1; i < depth.length; i += 1) {
      expect(depth[i]!.width).toBeLessThan(depth[i - 1]!.width);
      expect(depth[i]!.shade).toBeGreaterThan(depth[i - 1]!.shade);
      // Descending z-index is what keeps each card overlapped by the one in
      // front of it rather than the other way round.
      expect(depth[i]!.z).toBeLessThan(depth[i - 1]!.z);
    }
  });

  test("keeps every card landscape, so the artwork is never cropped to portrait", () => {
    renderCard();
    for (const card of screen.getAllByTestId("module-showcase-card-in-deck")) {
      const [width, height] = card.style.aspectRatio.split("/").map((part) => Number(part.trim()));
      expect(width! / height!).toBeGreaterThan(1);
    }
  });

  test("caps a lone card so a one-lesson module does not span the panel", () => {
    renderCard(summary({ lessonCount: 1, leadingLessons: [leadingLesson(1)] }));
    const [only] = screen.getAllByTestId("module-showcase-card-in-deck");
    expect(only!.style.maxWidth).not.toBe("");
  });

  test("the deck is artwork only, with no text of any kind", () => {
    renderCard();
    // No titles, no runtimes, no ordinals. The deck's whole job is to show
    // that a module holds several videos; the count line beside it states
    // the number, and the module overview names each one.
    expect(screen.getByTestId("module-showcase-deck").textContent).toBe("");
  });

  test("shows each lesson's own artwork", () => {
    renderCard();
    // Queried through the DOM rather than by role: the artwork carries
    // `alt=""` on purpose, which makes it presentational and invisible to
    // `getAllByRole("img")`.
    const images = screen.getByTestId("module-showcase-deck").querySelectorAll("img");
    expect(images).toHaveLength(6);
    expect(images[0]).toHaveAttribute("src", "/local-filesystem-lesson/poster-1.jpeg");
    expect(images[0]).toHaveAttribute("alt", "");
  });

  test("falls back to the gradient card when a lesson has no poster", () => {
    renderCard(
      summary({
        lessonCount: 2,
        leadingLessons: [leadingLesson(1), leadingLesson(2, { poster: undefined })],
      }),
    );
    expect(screen.getByTestId("module-showcase-deck").querySelectorAll("img")).toHaveLength(1);
    expect(screen.getAllByTestId("module-showcase-card-in-deck")).toHaveLength(2);
  });

  test("discloses the remainder when the module holds more lessons than the deck shows", () => {
    renderCard(summary({ lessonCount: 31 }));
    expect(screen.getByTestId("module-showcase-remainder")).toHaveTextContent(
      'remainingVideos:{"count":25}',
    );
  });

  test("omits the remainder when the deck shows every lesson", () => {
    renderCard();
    expect(screen.queryByTestId("module-showcase-remainder")).toBeNull();
  });

  test("renders a one-card deck for a single-lesson module with no special casing", () => {
    renderCard(
      summary({
        lessonCount: 1,
        totalDurationSeconds: 2160,
        leadingLessons: [leadingLesson(1, { title: "Weak Strong Forms" })],
      }),
    );
    expect(screen.getAllByTestId("module-showcase-card-in-deck")).toHaveLength(1);
    expect(screen.getByTestId("module-showcase-meta")).toHaveTextContent(
      metaText(1, "durationMinutes", { minutes: 36 }),
    );
    expect(screen.queryByTestId("module-showcase-remainder")).toBeNull();
  });

  test("hides the deck from assistive technology", () => {
    renderCard();
    // With the labels gone the deck names nothing: what it shows — that the
    // module holds several videos in order — the count line states outright.
    // Announcing six unlabelled images per card, ten cards deep, is noise.
    expect(screen.getByTestId("module-showcase-deck")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("keeps the remainder announced rather than hiding it with the artwork", () => {
    renderCard(summary({ lessonCount: 31 }));
    // "+25 more" is the only textual signal that the module holds more than
    // the deck shows, so it must not be swallowed as a seventh list item.
    const remainder = screen.getByTestId("module-showcase-remainder");
    expect(remainder.closest('[aria-hidden="true"]')).toBeNull();
  });

  test("exposes exactly two links, both naming the module, and none inside the deck", () => {
    renderCard();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/courses/course-1/modules/3-contractions-reductions");
    }
    // D2: the card is a container, not one big link — wrapping it would make
    // its accessible name swallow the count line and the button.
    expect(links[0]).toHaveAccessibleName("Contractions Reductions");
    // D3: the deck is decorative and never interactive.
    expect(within(screen.getByTestId("module-showcase-deck")).queryAllByRole("link")).toHaveLength(
      0,
    );
  });

  test("titles the module with a heading that links to its overview", () => {
    renderCard();
    const heading = screen.getByRole("heading", { name: "Contractions Reductions" });
    expect(within(heading).getByRole("link")).toHaveAttribute(
      "href",
      "/courses/course-1/modules/3-contractions-reductions",
    );
  });

  test("renders an empty module without a deck or a remainder", () => {
    renderCard(summary({ lessonCount: 0, totalDurationSeconds: 0, leadingLessons: [] }));
    expect(screen.queryByTestId("module-showcase-deck")).toBeNull();
    expect(screen.queryByTestId("module-showcase-remainder")).toBeNull();
    expect(screen.getByTestId("module-showcase-meta")).toHaveTextContent(
      metaText(0, "durationMinutes", { minutes: 0 }),
    );
  });
});
