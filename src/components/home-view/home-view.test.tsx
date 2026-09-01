import type { CourseLevel } from "@/components/course-ladder/course-ladder";
import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { HomeView } from "./home-view";

vi.mock("next-intl", () => ({ useTranslations: vi.fn() }));
// The panel has its own tests; here it must only be present and correctly
// placed. Rendering the real one would reach for `localStorage` and a Server
// Action, neither of which says anything about the home's composition.
vi.mock("@/components/continue-watching/continue-watching", () => ({
  ContinueWatching: () => <div data-testid="continue-watching-slot" />,
}));

const mockUseTranslations = vi.mocked(useTranslations);

const msg = (namespace: string, key: string, values?: Record<string, unknown>) =>
  values ? `${namespace}.${key}:${JSON.stringify(values)}` : `${namespace}.${key}`;

const home = (key: string, values?: Record<string, unknown>) => msg("HomePage", key, values);

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

const levelFor = (course: Course): CourseLevel => ({
  course,
  leadingModules: [
    Module.parse({
      id: `22222222-2222-4222-8222-${String(course.sequence).padStart(12, "0")}`,
      courseId: course.id,
      slug: "module-1",
      title: "Module 1",
      sequence: 1,
    }),
  ],
});

describe("HomeView", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      ((namespace: string) => (key: string, values?: Record<string, unknown>) =>
        msg(namespace, key, values)) as never,
    );
  });

  describe("GIVEN a catalog with two courses", () => {
    const twoLevels = [levelFor(basic), levelFor(advanced)];

    test("WHEN rendered THEN both courses get a card", () => {
      render(<HomeView levels={twoLevels} />);
      const cards = screen.getAllByTestId("course-level-card");
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent(basic.title);
      expect(cards[1]).toHaveTextContent(advanced.title);
    });

    test("WHEN rendered THEN the courses section announces itself and its size", () => {
      render(<HomeView levels={twoLevels} />);
      expect(screen.getByText(home("coursesEyebrow"))).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: home("coursesHeading", { count: 2 }) }),
      ).toBeInTheDocument();
      expect(screen.getByText(home("coursesCount", { count: 2 }))).toBeInTheDocument();
    });

    test("WHEN rendered THEN the hero states the platform, not one course", () => {
      render(<HomeView levels={twoLevels} />);
      expect(screen.getByRole("heading", { level: 1, name: home("heading") })).toBeInTheDocument();
      expect(screen.getByText(home("intro"))).toBeInTheDocument();
      expect(screen.getByText(home("eyebrow"))).toBeInTheDocument();
    });

    test("WHEN rendered THEN the hero carries no call to action of its own", () => {
      // The page's one primary action is `Resume`; each card carries its own.
      // A third button competing from the hero leaves no obvious next step.
      render(<HomeView levels={twoLevels} />);
      const hero = screen.getByRole("heading", { level: 1 }).closest("section");
      expect(hero?.querySelectorAll("a, button")).toHaveLength(0);
    });

    test("WHEN rendered THEN the continue-watching section precedes the ladder", () => {
      render(<HomeView levels={twoLevels} />);
      const panel = screen.getByTestId("continue-watching-slot");
      const ladder = screen.getByTestId("course-ladder");
      expect(panel.compareDocumentPosition(ladder) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test("WHEN rendered THEN no featured rail survives", () => {
      render(<HomeView levels={twoLevels} />);
      expect(screen.queryByTestId("featured-course")).toBeNull();
    });
  });

  describe("GIVEN a catalog with one course", () => {
    test("WHEN rendered THEN it renders one card under the same heading", () => {
      render(<HomeView levels={[levelFor(basic)]} />);
      expect(screen.getAllByTestId("course-level-card")).toHaveLength(1);
      expect(
        screen.getByRole("heading", { name: home("coursesHeading", { count: 1 }) }),
      ).toBeInTheDocument();
    });
  });

  describe("GIVEN an empty catalog", () => {
    test("WHEN rendered THEN it shows the localized empty state and no ladder", () => {
      render(<HomeView levels={[]} />);
      expect(screen.getByRole("status")).toHaveTextContent(home("catalogEmpty"));
      expect(screen.queryByTestId("course-ladder")).toBeNull();
    });

    test("WHEN rendered THEN the hero still stands", () => {
      render(<HomeView levels={[]} />);
      expect(screen.getByRole("heading", { level: 1, name: home("heading") })).toBeInTheDocument();
    });
  });
});
