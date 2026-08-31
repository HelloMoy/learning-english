import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { render, screen, waitFor, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseLadder } from "./course-ladder";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const msg = (namespace: string, key: string, values?: Record<string, unknown>) =>
  values ? `${namespace}.${key}:${JSON.stringify(values)}` : `${namespace}.${key}`;

const card = (key: string, values?: Record<string, unknown>) =>
  msg("Components.CourseLevelCard", key, values);

const buildCourse = (sequence: number, slug: string, title: string) =>
  Course.parse({
    id: `11111111-1111-4111-8111-${String(sequence).padStart(12, "0")}`,
    slug,
    title,
    description: `${title} description`,
    language: "en",
    lessonCount: 3,
    moduleCount: 2,
    sequence,
  });

const basic = buildCourse(1, "english-a1-pronunciation", "Basic — Foundational Pronunciation");
const advanced = buildCourse(2, "advanced-intermediate-course", "Advanced Intermediate Course");

const buildModule = (course: Course, sequence: number) =>
  Module.parse({
    id: `22222222-2222-4222-8222-${course.sequence}${String(sequence).padStart(11, "0")}`,
    courseId: course.id,
    slug: `module-${sequence}`,
    title: `Module ${sequence}`,
    sequence,
  });

const levels = [
  { course: basic, leadingModules: [buildModule(basic, 1), buildModule(basic, 2)] },
  { course: advanced, leadingModules: [buildModule(advanced, 1)] },
];

/** A `ContinueWatchingRepository` over one fixed answer. */
const makeRepository = (stored: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => stored,
  set: async () => {},
});

const locationIn = (course: Course) =>
  ContinueWatchingLocation.parse({
    courseSlug: course.slug,
    moduleSlug: "module-1",
    lessonId: "33333333-3333-4333-8333-333333333333",
  });

const renderLadder = (stored: ContinueWatchingLocation | null = null) =>
  render(
    <CourseLadder
      levels={levels}
      continueWatching={makeRepository(stored)}
    />,
  );

describe("CourseLadder", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      ((namespace: string) => (key: string, values?: Record<string, unknown>) =>
        msg(namespace, key, values)) as never,
    );
  });

  test("renders one card per course, in ladder order", () => {
    renderLadder();
    const cards = screen.getAllByTestId("course-level-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(basic.title);
    expect(cards[1]).toHaveTextContent(advanced.title);
  });

  test("drops no course when the catalog holds more than one", () => {
    renderLadder();
    expect(screen.getByRole("heading", { name: basic.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: advanced.title })).toBeInTheDocument();
  });

  test("renders a numbered track with one node per course", () => {
    renderLadder();
    const nodes = within(screen.getByTestId("course-ladder-track")).getAllByTestId(
      "course-ladder-node",
    );
    expect(nodes.map((node) => node.textContent)).toEqual(["01", "02"]);
  });

  test("renders a single course without empty slots", () => {
    render(
      <CourseLadder
        levels={[levels[0]!]}
        continueWatching={makeRepository(null)}
      />,
    );
    expect(screen.getAllByTestId("course-level-card")).toHaveLength(1);
    expect(
      within(screen.getByTestId("course-ladder-track")).getAllByTestId("course-ladder-node"),
    ).toHaveLength(1);
  });

  describe("GIVEN no continue-watching record", () => {
    test("WHEN rendered THEN every card reads as not started", async () => {
      renderLadder(null);
      await waitFor(() => {
        const states = screen.getAllByTestId("course-level-state");
        expect(states.every((state) => state.textContent === card("notStarted"))).toBe(true);
      });
    });
  });

  describe("GIVEN a record pointing at the second course", () => {
    test("WHEN the record has been read THEN only that card is marked", async () => {
      renderLadder(locationIn(advanced));

      await waitFor(() => {
        const cards = screen.getAllByTestId("course-level-card");
        expect(cards[1]).toHaveAttribute("data-state", "in-progress");
      });
      expect(screen.getAllByTestId("course-level-card")[0]).toHaveAttribute(
        "data-state",
        "not-started",
      );
    });

    test("WHEN the record has been read THEN that card invites continuing", async () => {
      renderLadder(locationIn(advanced));
      await waitFor(() => {
        const ctas = screen.getAllByTestId("course-level-cta");
        expect(ctas[1]).toHaveTextContent(card("continueCourse"));
        expect(ctas[0]).toHaveTextContent(card("startCourse"));
      });
    });
  });

  describe("GIVEN a record pointing at a course no longer in the catalog", () => {
    test("WHEN rendered THEN no card is marked", async () => {
      const stale = ContinueWatchingLocation.parse({
        courseSlug: "a-retired-course",
        moduleSlug: "module-1",
        lessonId: "33333333-3333-4333-8333-333333333333",
      });
      renderLadder(stale);

      await waitFor(() => {
        expect(screen.getAllByTestId("course-level-card")).toHaveLength(2);
      });
      for (const element of screen.getAllByTestId("course-level-card")) {
        expect(element).toHaveAttribute("data-state", "not-started");
      }
    });
  });

  describe("GIVEN the server render, before storage can be read", () => {
    test("WHEN first painted THEN every card reads as not started", () => {
      // The honest pre-hydration state. Marking a card before the record is
      // known would flash a claim the markup cannot justify.
      renderLadder(locationIn(advanced));
      for (const element of screen.getAllByTestId("course-level-card")) {
        expect(element).toHaveAttribute("data-state", "not-started");
      }
    });
  });
});
