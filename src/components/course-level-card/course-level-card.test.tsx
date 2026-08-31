import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";

import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseLevelCard } from "./course-level-card";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * The string the key-echoing `useTranslations` mock produces. The card reads
 * two namespaces — its own copy and the shared count vocabulary — so the mock
 * keeps the namespace in the output; asserting on a bare key could not tell
 * the two apart.
 */
const msg = (namespace: string, key: string, values?: Record<string, unknown>) =>
  values ? `${namespace}.${key}:${JSON.stringify(values)}` : `${namespace}.${key}`;

const card = (key: string, values?: Record<string, unknown>) =>
  msg("Components.CourseLevelCard", key, values);
const counts = (key: string, values?: Record<string, unknown>) =>
  msg("CourseCatalog.card", key, values);

const course = Course.parse({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "American vowels, contractions and reductions.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
  sequence: 2,
});

const buildModule = (sequence: number) =>
  Module.parse({
    id: `22222222-2222-4222-8222-${String(sequence).padStart(12, "0")}`,
    courseId: course.id,
    slug: `module-${sequence}`,
    title: `Module ${sequence}`,
    sequence,
  });

const leadingModules = [1, 2, 3].map(buildModule);

const renderCard = (props?: {
  course?: Course;
  leadingModules?: Module[];
  state?: "in-progress" | "not-started";
}) =>
  render(
    <CourseLevelCard
      course={props?.course ?? course}
      leadingModules={props?.leadingModules ?? leadingModules}
      state={props?.state ?? "not-started"}
    />,
  );

describe("CourseLevelCard", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      ((namespace: string) => (key: string, values?: Record<string, unknown>) =>
        msg(namespace, key, values)) as never,
    );
  });

  test("renders the course's ladder ordinal from its sequence", () => {
    renderCard();
    expect(screen.getByTestId("course-level-ordinal")).toHaveTextContent(
      card("levelOrdinal", { number: 2 }),
    );
  });

  test("names the course and links its heading to the course overview", () => {
    renderCard();
    const heading = screen.getByRole("heading", { name: course.title });
    expect(within(heading).getByRole("link")).toHaveAttribute(
      "href",
      "/courses/advanced-intermediate-course",
    );
  });

  test("shows the course description", () => {
    renderCard();
    expect(screen.getByText(course.description)).toBeInTheDocument();
  });

  test("counts the course's lessons and videos with the shared vocabulary", () => {
    renderCard();
    expect(screen.getByText(counts("moduleCount", { count: 10 }))).toBeInTheDocument();
    expect(screen.getByText(counts("lessonCount", { count: 107 }))).toBeInTheDocument();
  });

  test("lists the leading modules with their ordinals, in sequence order", () => {
    renderCard();
    const items = within(screen.getByTestId("course-level-modules")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(card("moduleOrdinal", { number: 1 }));
    expect(items[0]).toHaveTextContent("Module 1");
    expect(items[2]).toHaveTextContent(card("moduleOrdinal", { number: 3 }));
  });

  test("states how many modules the preview leaves out", () => {
    renderCard();
    // 10 modules, 3 previewed. Without this the card would silently claim
    // the course is three lessons long.
    expect(screen.getByTestId("course-level-more")).toHaveTextContent(
      card("moreModules", { count: 7 }),
    );
  });

  test("omits the remainder line when the preview covers every module", () => {
    const shortCourse = Course.parse({ ...course, moduleCount: 3, sequence: 1 });
    renderCard({ course: shortCourse });
    expect(screen.queryByTestId("course-level-more")).toBeNull();
  });

  test("renders no module list when the course has none", () => {
    const emptyCourse = Course.parse({ ...course, moduleCount: 0, lessonCount: 0 });
    renderCard({ course: emptyCourse, leadingModules: [] });
    expect(screen.queryByTestId("course-level-modules")).toBeNull();
  });

  describe("GIVEN the course has not been started", () => {
    test("WHEN rendered THEN it invites the learner to start it", () => {
      renderCard({ state: "not-started" });
      expect(screen.getByTestId("course-level-state")).toHaveTextContent(card("notStarted"));
      const cta = screen.getByTestId("course-level-cta");
      expect(cta).toHaveTextContent(card("startCourse"));
      expect(cta).toHaveAttribute("href", "/courses/advanced-intermediate-course");
    });
  });

  describe("GIVEN the course is the one being continued", () => {
    test("WHEN rendered THEN it is marked and invites the learner to continue", () => {
      renderCard({ state: "in-progress" });
      expect(screen.getByTestId("course-level-state")).toHaveTextContent(card("inProgress"));
      expect(screen.getByTestId("course-level-cta")).toHaveTextContent(card("continueCourse"));
    });

    test("WHEN rendered THEN the card is flagged for styling and assertions", () => {
      renderCard({ state: "in-progress" });
      expect(screen.getByTestId("course-level-card")).toHaveAttribute("data-state", "in-progress");
    });
  });
});
