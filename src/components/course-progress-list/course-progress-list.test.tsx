import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { faker } from "@faker-js/faker";
import { act, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { CourseProgressList, type ContinuedLesson } from "./course-progress-list";

const courseId = faker.string.uuid();

const buildModule = (sequence: number, title: string) =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId,
    slug: `module-${sequence}`,
    title,
    sequence,
  });

const introduction = buildModule(1, "Introduction");
const vowels = buildModule(2, "Vowels");
const consonants = buildModule(3, "Consonants");

const slicesFor = (module: Module, count: number): LessonProgressSlice[] =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    moduleId: module.id,
    durationSeconds: 300,
    title: faker.lorem.words(3),
    sequence: index + 1,
  }));

const introductionLessons = slicesFor(introduction, 1);
const vowelLessons = slicesFor(vowels, 3);
const consonantLessons = slicesFor(consonants, 2);
const lessonRuntimes = [...consonantLessons, ...introductionLessons, ...vowelLessons];

const continuedInVowels: ContinuedLesson = {
  moduleId: vowels.id,
  lessonTitle: faker.lorem.words(3),
  lessonHref: `/courses/basic-course/modules/module-2/lessons/${vowelLessons[1]!.id}`,
};

const markComplete = (lessonId: LessonId) =>
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");

const announceStorageChange = () =>
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });

const renderList = (continued: ContinuedLesson | null = continuedInVowels) =>
  renderInLocale(
    <CourseProgressList
      courseSlug="basic-course"
      courseTitle="Basic Course"
      // Deliberately out of order: the list orders by `sequence`, not by arrival.
      modules={[consonants, introduction, vowels]}
      lessonRuntimes={lessonRuntimes}
      continued={continued}
    />,
  );

const cards = () =>
  within(screen.getByRole("list", { name: "Lessons in Basic Course" })).getAllByRole("listitem");

const cardTitles = () =>
  cards().map((card) => within(card).getByTestId("progress-card-title").textContent);

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("CourseProgressList", () => {
  test("WHEN nothing is continued THEN every lesson is a card in sequence order and none offers Continue", () => {
    renderList(null);

    expect(screen.getByRole("heading", { level: 2, name: "Basic Course" })).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Introduction", "Vowels", "Consonants"]);
    expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
  });

  test("WHEN a lesson is continued THEN its module's card leads, is marked current and names the last watched video", () => {
    renderList();

    expect(cardTitles()).toEqual(["Vowels", "Introduction", "Consonants"]);
    const [lead] = cards();
    expect(lead).toHaveAttribute("data-state", "current");
    expect(within(lead!).getByText("Current")).toBeInTheDocument();
    expect(lead).toHaveTextContent(`Last watched: ${continuedInVowels.lessonTitle}`);
  });

  test("WHEN a lesson is continued THEN only its card offers Continue, and Continue opens that video", () => {
    renderList();

    const [lead, ...rest] = cards();
    expect(within(lead!).getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      expect.stringContaining(continuedInVowels.lessonHref),
    );
    for (const card of rest) {
      expect(within(card).queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
    }
  });

  test("WHEN rendered THEN each card links to its module overview", () => {
    renderList();

    expect(screen.getByRole("link", { name: "Consonants" })).toHaveAttribute(
      "href",
      expect.stringContaining("/courses/basic-course/modules/module-3"),
    );
    expect(screen.getByRole("link", { name: "Vowels" })).toHaveAttribute(
      "href",
      expect.stringContaining("/courses/basic-course/modules/module-2"),
    );
  });

  test("WHEN some videos are complete THEN the course and each card count them, with the share on its ring", () => {
    markComplete(introductionLessons[0]!.id);
    markComplete(vowelLessons[0]!.id);
    announceStorageChange();

    renderList(null);

    expect(screen.getByText("2 of 6 videos watched")).toBeInTheDocument();
    const [first, second, third] = cards();
    expect(first).toHaveTextContent("1 of 1 video");
    expect(first).toHaveTextContent("100%");
    expect(second).toHaveTextContent("1 of 3 videos");
    expect(second).toHaveTextContent("33%");
    expect(third).toHaveTextContent("0 of 2 videos");
    expect(third).toHaveTextContent("0%");
  });

  test("WHEN one of a module's three videos is complete THEN its card's ring fill covers a third of the circle", () => {
    markComplete(vowelLessons[0]!.id);
    announceStorageChange();

    renderList(null);

    const fill = within(cards()[1]!).getByTestId("progress-ring-fill");
    const circumference = 2 * Math.PI * Number(fill.getAttribute("r"));
    const [drawn] = fill.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(drawn).toBeCloseTo(circumference / 3, 1);
    expect(cards()[1]).toHaveTextContent("33%");
  });

  test("WHEN a module is fully watched THEN its card is marked complete", () => {
    markComplete(introductionLessons[0]!.id);
    announceStorageChange();

    renderList(null);

    expect(cards()[0]).toHaveAttribute("data-state", "complete");
  });
});
