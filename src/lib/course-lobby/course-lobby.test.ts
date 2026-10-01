import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";
import { aCourseView, asReference } from "@/test-setup/stubs/course-views";

import { describe, expect, test } from "vitest";

import { courseLobby, type LobbyEntry } from "./course-lobby";

const basic = aCourseView("basic-course", 1, [1, 3]);
const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);
const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2]));

const enrolledModelsOf = (enrolledSlugs: ReadonlyArray<string>, courses: CourseForView[]) => {
  const shelf = courseShelf({
    courses,
    enrolledSlugs: new Set(enrolledSlugs),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
  });
  const learner = { positions: new Map(), claimedPrizes: new Set<string>() };
  return [shelf.featured, ...shelf.otherEnrolled].flatMap((course) =>
    course ? [courseCardModel(course, learner)] : [],
  );
};

const describeEntry = (entry: LobbyEntry) =>
  entry.kind === "enrolled"
    ? `enrolled:${entry.model.course.slug}`
    : `joinable:${entry.view.course.slug}`;

describe("courseLobby", () => {
  describe("GIVEN a learner enrolled in nothing", () => {
    test("WHEN the lobby is read THEN every course is joinable in catalog order", () => {
      // Arrange
      const courses = [atlas, advanced, basic];

      // Act
      const lobby = courseLobby([], courses);

      // Assert
      expect(lobby.map(describeEntry)).toEqual([
        "joinable:basic-course",
        "joinable:advanced-intermediate-course",
        "joinable:atlas-of-american-sounds",
      ]);
    });
  });

  describe("GIVEN a learner enrolled in two courses, the second one leading", () => {
    test("WHEN the lobby is read THEN the enrolled courses come first in the order given AND the rest follow", () => {
      // Arrange
      const courses = [basic, advanced, atlas];
      const [basicModel, advancedModel] = enrolledModelsOf(
        ["basic-course", "advanced-intermediate-course"],
        courses,
      );

      // Act
      const lobby = courseLobby([advancedModel!, basicModel!], courses);

      // Assert
      expect(lobby.map(describeEntry)).toEqual([
        "enrolled:advanced-intermediate-course",
        "enrolled:basic-course",
        "joinable:atlas-of-american-sounds",
      ]);
    });
  });

  describe("GIVEN a learner enrolled in the reference course only", () => {
    test("WHEN the lobby is read THEN it leads AND the level courses follow in catalog order", () => {
      // Arrange
      const courses = [basic, advanced, atlas];
      const enrolled = enrolledModelsOf(["atlas-of-american-sounds"], courses);

      // Act
      const lobby = courseLobby(enrolled, courses);

      // Assert
      expect(lobby.map(describeEntry)).toEqual([
        "enrolled:atlas-of-american-sounds",
        "joinable:basic-course",
        "joinable:advanced-intermediate-course",
      ]);
    });
  });
});
