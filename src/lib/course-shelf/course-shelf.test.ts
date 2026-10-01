import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { Course } from "@/domain/entities/course/course";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { aCourseView, asReference, lessonOf } from "@/test-setup/stubs/course-views";

import { describe, expect, test } from "vitest";

import {
  courseCardModel,
  courseFacts,
  courseFirstVideo,
  coursePrizes,
  courseShelf,
  type CourseShelfInput,
} from "./course-shelf";

const basic = aCourseView("basic-course", 1, [1, 3]);
const advanced = aCourseView("advanced-intermediate-course", 2, [2, 2]);
const atlas = asReference(aCourseView("atlas-of-american-sounds", 3, [2]));

const recordAt = (
  view: CourseForView,
  moduleIndex: number,
  lessonIndex: number,
  watchedAt: number,
) =>
  ContinueWatchingRecord.parse({
    location: {
      courseSlug: view.course.slug,
      moduleSlug: view.modules[moduleIndex]!.slug,
      lessonId: lessonOf(view, moduleIndex, lessonIndex).id,
    },
    watchedAt,
  });

const shelfOf = (overrides: Partial<CourseShelfInput>) =>
  courseShelf({
    courses: [basic, advanced],
    enrolledSlugs: new Set(),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
    ...overrides,
  });

const slugsOf = (views: ReadonlyArray<{ course: Course }>) => views.map((view) => view.course.slug);

describe("courseShelf", () => {
  describe("GIVEN a learner enrolled in nothing", () => {
    test("WHEN the shelf is read THEN nothing is featured AND the first course is recommended", () => {
      const shelf = shelfOf({ courses: [advanced, basic] });

      expect(shelf.featured).toBeNull();
      expect(shelf.otherEnrolled).toEqual([]);
      expect(shelf.recommended?.view.course.slug).toBe("basic-course");
      expect(shelf.recommended?.progress.continueTarget.kind).toBe("start");
    });

    test("WHEN the shelf is read THEN the rest of the catalog is available, without the recommended course", () => {
      const shelf = shelfOf({ courses: [advanced, basic] });

      expect(slugsOf(shelf.available)).toEqual(["advanced-intermediate-course"]);
    });
  });

  describe("GIVEN a learner enrolled in nothing AND a reference course ahead of the levels", () => {
    test("WHEN the shelf is read THEN the level-1 course is recommended, not the reference", () => {
      const referenceFirst = asReference(aCourseView("atlas-of-american-sounds", 1, [2]));
      const levelOne = {
        ...aCourseView("basic-course", 2, [1, 3]),
        standing: { kind: "level", number: 1 } as const,
      };
      const levelTwo = {
        ...aCourseView("advanced-intermediate-course", 3, [2, 2]),
        standing: { kind: "level", number: 2 } as const,
      };
      const shelf = shelfOf({ courses: [referenceFirst, levelOne, levelTwo] });

      expect(shelf.recommended?.view.course.slug).toBe("basic-course");
      expect(slugsOf(shelf.available)).toEqual([
        "atlas-of-american-sounds",
        "advanced-intermediate-course",
      ]);
    });
  });

  describe("GIVEN a learner enrolled in Basic who never opened a lesson", () => {
    test("WHEN the shelf is read THEN Basic is featured without a record AND Advanced is available", () => {
      const shelf = shelfOf({ enrolledSlugs: new Set(["basic-course"]) });

      expect(shelf.featured?.view.course.slug).toBe("basic-course");
      expect(shelf.featured?.record).toBeNull();
      expect(shelf.recommended).toBeNull();
      expect(slugsOf(shelf.available)).toEqual(["advanced-intermediate-course"]);
    });
  });

  describe("GIVEN a learner enrolled in both who last watched Advanced", () => {
    const records = [recordAt(advanced, 1, 0, 2_000), recordAt(basic, 1, 1, 1_000)];

    test("WHEN the shelf is read THEN Advanced is featured AND Basic is the other enrolled course", () => {
      const shelf = shelfOf({
        enrolledSlugs: new Set(["basic-course", "advanced-intermediate-course"]),
        records,
      });

      expect(shelf.featured?.view.course.slug).toBe("advanced-intermediate-course");
      expect(slugsOf(shelf.otherEnrolled.map(({ view }) => view))).toEqual(["basic-course"]);
      expect(shelf.available).toEqual([]);
    });

    test("WHEN the shelf is read THEN each course continues from its own place", () => {
      const shelf = shelfOf({
        enrolledSlugs: new Set(["basic-course", "advanced-intermediate-course"]),
        records,
      });

      const featuredTarget = shelf.featured?.progress.continueTarget;
      const basicTarget = shelf.otherEnrolled[0]?.progress.continueTarget;
      expect(featuredTarget?.kind === "continue" && featuredTarget.lesson.id).toBe(
        lessonOf(advanced, 1, 0).id,
      );
      expect(basicTarget?.kind === "continue" && basicTarget.lesson.id).toBe(
        lessonOf(basic, 1, 1).id,
      );
    });
  });

  describe("GIVEN a learner enrolled in both with no record", () => {
    test("WHEN the shelf is read THEN the first course by sequence is featured", () => {
      const shelf = shelfOf({
        courses: [advanced, basic],
        enrolledSlugs: new Set(["basic-course", "advanced-intermediate-course"]),
      });

      expect(shelf.featured?.view.course.slug).toBe("basic-course");
      expect(slugsOf(shelf.otherEnrolled.map(({ view }) => view))).toEqual([
        "advanced-intermediate-course",
      ]);
    });
  });

  describe("GIVEN a record in a course the learner is not enrolled in", () => {
    test("WHEN the shelf is read THEN that record does not feature the course", () => {
      const shelf = shelfOf({
        enrolledSlugs: new Set(["basic-course"]),
        records: [recordAt(advanced, 0, 0, 2_000)],
      });

      expect(shelf.featured?.view.course.slug).toBe("basic-course");
      expect(slugsOf(shelf.available)).toEqual(["advanced-intermediate-course"]);
    });
  });

  describe("GIVEN every video of the other enrolled course complete", () => {
    test("WHEN the shelf is read THEN that course reads as completed AND the featured one does not", () => {
      const allBasicVideos = basic.moduleSummaries.flatMap(({ lessons }) =>
        lessons.map(({ id }) => id),
      );

      const shelf = shelfOf({
        enrolledSlugs: new Set(["basic-course", "advanced-intermediate-course"]),
        records: [recordAt(advanced, 0, 0, 2_000)],
        completedIds: new Set(allBasicVideos),
      });

      expect(shelf.otherEnrolled[0]?.isCompleted).toBe(true);
      expect(shelf.featured?.isCompleted).toBe(false);
    });
  });
});

describe("courseFacts", () => {
  test("WHEN read THEN it counts modules, videos and the total runtime", () => {
    expect(courseFacts(basic)).toEqual({ moduleCount: 2, videoCount: 4, runtimeSeconds: 4 * 600 });
  });
});

describe("coursePrizes", () => {
  describe("GIVEN a course with an empty module", () => {
    test("WHEN read THEN only the modules holding videos have a prize", () => {
      // Arrange
      const view = aCourseView("basic-course", 1, [2, 0, 1]);

      // Act
      const prizes = coursePrizes(view, new Set());

      // Assert
      expect(prizes).toHaveLength(2);
      expect(prizes.every((entry) => !entry.isClaimed)).toBe(true);
    });
  });

  describe("GIVEN a claimed module", () => {
    test("WHEN read THEN its prize is claimed AND the others are not", () => {
      // Arrange
      const view = aCourseView("basic-course", 1, [1, 1]);

      // Act
      const prizes = coursePrizes(view, new Set([view.modules[1]!.slug]));

      // Assert
      expect(prizes.map((entry) => entry.isClaimed)).toEqual([false, true]);
    });
  });
});

describe("courseFirstVideo", () => {
  describe("GIVEN a course whose first module holds videos", () => {
    test("WHEN read THEN it is the first video of the first module", () => {
      // Arrange
      const view = basic;

      // Act
      const first = courseFirstVideo(view);

      // Assert
      expect(first).toEqual({ module: view.modules[0], lesson: lessonOf(view, 0, 0) });
    });
  });

  describe("GIVEN a course whose first module is empty", () => {
    test("WHEN read THEN it is the first video of the next module that holds one", () => {
      // Arrange
      const view = aCourseView("basic-course", 1, [0, 2]);

      // Act
      const first = courseFirstVideo(view);

      // Assert
      expect(first).toEqual({ module: view.modules[1], lesson: lessonOf(view, 1, 0) });
    });
  });

  describe("GIVEN a course with no videos", () => {
    test("WHEN read THEN there is no first video", () => {
      // Arrange
      const view = aCourseView("basic-course", 1, [0]);

      // Act
      const first = courseFirstVideo(view);

      // Assert
      expect(first).toBeNull();
    });
  });
});

describe("courseCardModel", () => {
  const enrolledInBoth = new Set(["basic-course", "advanced-intermediate-course"]);

  test("WHEN the target video has a saved position THEN the model carries it with the watched time", () => {
    const record = recordAt(advanced, 1, 0, 5_000);
    const shelf = shelfOf({
      enrolledSlugs: enrolledInBoth,
      records: [record],
      positions: new Map([[lessonOf(advanced, 1, 0).id, 365]]),
    });

    const model = courseCardModel(shelf.featured!, {
      positions: new Map([[lessonOf(advanced, 1, 0).id, 365]]),
      claimedPrizes: new Set(),
    });

    expect(model.target?.lesson.id).toBe(lessonOf(advanced, 1, 0).id);
    expect(model.targetPositionSeconds).toBe(365);
    expect(model.targetVideoCount).toBe(2);
    expect(model.watchedAt).toBe(5_000);
  });

  test("WHEN the target has no saved position THEN the model carries none", () => {
    const shelf = shelfOf({ enrolledSlugs: new Set(["basic-course"]) });

    const model = courseCardModel(shelf.featured!, {
      positions: new Map(),
      claimedPrizes: new Set(),
    });

    expect(model.targetPositionSeconds).toBeNull();
    expect(model.watchedAt).toBeNull();
  });

  test("WHEN read THEN the model carries the course's standing", () => {
    const shelf = shelfOf({
      courses: [basic, atlas],
      enrolledSlugs: new Set(["atlas-of-american-sounds"]),
    });

    const model = courseCardModel(shelf.featured!, {
      positions: new Map(),
      claimedPrizes: new Set(),
    });

    expect(model.standing).toEqual({ kind: "reference" });
  });

  test("WHEN a module's prize was claimed THEN only that prize reads as claimed", () => {
    const shelf = shelfOf({ enrolledSlugs: new Set(["basic-course"]) });

    const model = courseCardModel(shelf.featured!, {
      positions: new Map(),
      claimedPrizes: new Set(["module-1"]),
    });

    expect(model.prizes.map((prize) => prize.isClaimed)).toEqual([true, false]);
  });
});
