import { LessonId } from "@/domain/entities/ids/ids";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  deriveModuleRoute,
  splitRuntime,
  type LearnerProgress,
  type RouteLesson,
} from "./module-route";

const SECONDS_PER_MINUTE = 60;
const LESSON_DURATION_SECONDS = 600;

const makeLessons = (count: number): RouteLesson[] =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    durationSeconds: LESSON_DURATION_SECONDS,
  }));

const progressWith = ({
  completed = [],
  positions = [],
}: {
  completed?: LessonId[];
  positions?: [LessonId, number][];
}): LearnerProgress => ({
  completedLessonIds: new Set(completed),
  positions: new Map(positions),
});

const stateOf = (lessonId: LessonId, progress: LearnerProgress, lessons: RouteLesson[]) =>
  deriveModuleRoute(lessons, progress).steps.find((step) => step.lessonId === lessonId)?.state;

describe("splitRuntime", () => {
  describe("GIVEN a runtime longer than an hour", () => {
    test("WHEN the Vowels module's 9,525 seconds are split THEN it reads 2 hours 39 minutes", () => {
      expect(splitRuntime(9525)).toEqual({ hours: 2, minutes: 39 });
    });
  });

  describe("GIVEN a runtime under an hour", () => {
    test("WHEN 6 minutes are split THEN no hours are counted", () => {
      expect(splitRuntime(6 * SECONDS_PER_MINUTE)).toEqual({ hours: 0, minutes: 6 });
    });
  });

  describe("GIVEN a runtime that rounds up to the next hour", () => {
    test("WHEN 59 minutes 45 seconds are split THEN it carries into a whole hour", () => {
      expect(splitRuntime(59 * SECONDS_PER_MINUTE + 45)).toEqual({ hours: 1, minutes: 0 });
    });
  });

  describe("GIVEN nothing left to watch", () => {
    test("WHEN zero seconds are split THEN both parts are zero", () => {
      expect(splitRuntime(0)).toEqual({ hours: 0, minutes: 0 });
    });
  });
});

describe("deriveModuleRoute — finished lessons", () => {
  describe("GIVEN a lesson the learner marked complete", () => {
    test("WHEN the route is derived THEN that lesson's step is finished", () => {
      const lessons = makeLessons(3);
      const progress = progressWith({ completed: [lessons[0]!.id] });

      expect(stateOf(lessons[0]!.id, progress, lessons)).toBe("finished");
    });
  });

  describe("GIVEN a lesson watched past its finish threshold but never marked", () => {
    test("WHEN the route is derived THEN that lesson's step is still finished", () => {
      const lessons = makeLessons(3);
      const threshold = finishThresholdSeconds(LESSON_DURATION_SECONDS);
      const progress = progressWith({ positions: [[lessons[0]!.id, threshold]] });

      expect(stateOf(lessons[0]!.id, progress, lessons)).toBe("finished");
    });
  });

  describe("GIVEN a lesson only partly watched", () => {
    test("WHEN the route is derived THEN its step is not finished and carries the watched fraction", () => {
      const lessons = makeLessons(3);
      const progress = progressWith({ positions: [[lessons[0]!.id, 240]] });

      const step = deriveModuleRoute(lessons, progress).steps[0]!;

      expect(step.state).not.toBe("finished");
      expect(step.watchedFraction).toBeCloseTo(0.4);
    });
  });

  describe("GIVEN a finished lesson", () => {
    test("WHEN the route is derived THEN its watched fraction is full", () => {
      const lessons = makeLessons(2);
      const progress = progressWith({ completed: [lessons[1]!.id] });

      expect(deriveModuleRoute(lessons, progress).steps[1]!.watchedFraction).toBe(1);
    });
  });
});

describe("deriveModuleRoute — the current lesson", () => {
  const statesOf = (lessons: RouteLesson[], progress: LearnerProgress) =>
    deriveModuleRoute(lessons, progress).steps.map((step) => step.state);

  describe("GIVEN the first five lessons are finished", () => {
    test("WHEN the route is derived THEN the sixth is current and the rest are upcoming", () => {
      const lessons = makeLessons(8);
      const progress = progressWith({ completed: lessons.slice(0, 5).map((lesson) => lesson.id) });

      expect(statesOf(lessons, progress)).toEqual([
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
        "current",
        "upcoming",
        "upcoming",
      ]);
    });
  });

  describe("GIVEN a module the learner has never opened", () => {
    test("WHEN the route is derived THEN the first lesson is current", () => {
      const lessons = makeLessons(3);

      expect(statesOf(lessons, progressWith({}))).toEqual(["current", "upcoming", "upcoming"]);
    });
  });

  describe("GIVEN a learner who skipped ahead and finished videos 25–27", () => {
    test("WHEN the route is derived THEN video 28 is current and 1–24 stay upcoming", () => {
      const lessons = makeLessons(30);
      const progress = progressWith({
        completed: lessons.slice(24, 27).map((lesson) => lesson.id),
      });

      const states = statesOf(lessons, progress);

      expect(states[27]).toBe("current");
      expect(states.slice(0, 24).every((state) => state === "upcoming")).toBe(true);
    });
  });

  describe("GIVEN the furthest video with progress is only partly watched", () => {
    test("WHEN the route is derived THEN that video is current, not an earlier unstarted one", () => {
      const lessons = makeLessons(8);
      const progress = progressWith({
        completed: [lessons[0]!.id],
        positions: [[lessons[6]!.id, 240]],
      });

      expect(statesOf(lessons, progress)).toEqual([
        "finished",
        "upcoming",
        "upcoming",
        "upcoming",
        "upcoming",
        "upcoming",
        "current",
        "upcoming",
      ]);
    });
  });

  describe("GIVEN videos 25–27 finished and video 2 then partly rewatched", () => {
    test("WHEN the route is derived THEN the review does not move the current video back", () => {
      const lessons = makeLessons(30);
      const progress = progressWith({
        completed: lessons.slice(24, 27).map((lesson) => lesson.id),
        positions: [[lessons[1]!.id, 240]],
      });

      const states = statesOf(lessons, progress);

      expect(states[27]).toBe("current");
      expect(states[1]).toBe("upcoming");
    });
  });

  describe("GIVEN the last video is finished with gaps earlier in the module", () => {
    test("WHEN nothing unfinished follows it THEN the first unfinished video is current", () => {
      const lessons = makeLessons(5);
      const progress = progressWith({
        completed: [lessons[0]!.id, lessons[1]!.id, lessons[4]!.id],
      });

      expect(statesOf(lessons, progress)).toEqual([
        "finished",
        "finished",
        "current",
        "upcoming",
        "finished",
      ]);
    });
  });

  describe("GIVEN every lesson is finished", () => {
    test("WHEN the route is derived THEN no step is current", () => {
      const lessons = makeLessons(3);
      const progress = progressWith({ completed: lessons.map((lesson) => lesson.id) });

      expect(statesOf(lessons, progress)).toEqual(["finished", "finished", "finished"]);
    });
  });

  describe("GIVEN lessons handed over out of order", () => {
    test("WHEN the route is derived THEN steps follow sequence order and the video after the furthest progress is current", () => {
      const [first, second, third] = makeLessons(3);
      const progress = progressWith({ completed: [first!.id] });

      const steps = deriveModuleRoute([third!, first!, second!], progress).steps;

      expect(steps.map((step) => step.lessonId)).toEqual([first!.id, second!.id, third!.id]);
      expect(steps.map((step) => step.state)).toEqual(["finished", "current", "upcoming"]);
    });
  });
});

describe("deriveModuleRoute — the last opened lesson", () => {
  const statesOf = (lessons: RouteLesson[], progress: LearnerProgress) =>
    deriveModuleRoute(lessons, progress).steps.map((step) => step.state);

  const lastOpened = (progress: LearnerProgress, lessonId: LessonId): LearnerProgress => ({
    ...progress,
    lastOpenedLessonId: lessonId,
  });

  describe("GIVEN videos 25–27 finished, then the learner went back and finished 1–2", () => {
    test("WHEN video 2 was opened last THEN video 3 is current, not video 28", () => {
      const lessons = makeLessons(30);
      const finished = [...lessons.slice(24, 27), ...lessons.slice(0, 2)];
      const progress = lastOpened(
        progressWith({ completed: finished.map((lesson) => lesson.id) }),
        lessons[1]!.id,
      );

      const states = statesOf(lessons, progress);

      expect(states[2]).toBe("current");
      expect(states[27]).toBe("upcoming");
    });
  });

  describe("GIVEN videos 25–27 finished and video 7 opened last, partly watched", () => {
    test("WHEN the route is derived THEN video 7 itself is current", () => {
      const lessons = makeLessons(30);
      const progress = lastOpened(
        progressWith({
          completed: lessons.slice(24, 27).map((lesson) => lesson.id),
          positions: [[lessons[6]!.id, 240]],
        }),
        lessons[6]!.id,
      );

      expect(statesOf(lessons, progress)[6]).toBe("current");
    });
  });

  describe("GIVEN videos 25–27 finished and video 27 opened last", () => {
    test("WHEN the route is derived THEN the next unfinished video, 28, is current", () => {
      const lessons = makeLessons(30);
      const progress = lastOpened(
        progressWith({ completed: lessons.slice(24, 27).map((lesson) => lesson.id) }),
        lessons[26]!.id,
      );

      expect(statesOf(lessons, progress)[27]).toBe("current");
    });
  });

  describe("GIVEN the last video was opened last and finished, with gaps earlier", () => {
    test("WHEN nothing unfinished follows it THEN the first unfinished video is current", () => {
      const lessons = makeLessons(5);
      const progress = lastOpened(
        progressWith({ completed: [lessons[0]!.id, lessons[1]!.id, lessons[4]!.id] }),
        lessons[4]!.id,
      );

      expect(statesOf(lessons, progress)).toEqual([
        "finished",
        "finished",
        "current",
        "upcoming",
        "finished",
      ]);
    });
  });

  describe("GIVEN the last opened lesson belongs to another module", () => {
    test("WHEN the route is derived THEN the furthest progress decides, and video 28 is current", () => {
      const lessons = makeLessons(30);
      const progress = lastOpened(
        progressWith({ completed: lessons.slice(24, 27).map((lesson) => lesson.id) }),
        LessonId.parse(faker.string.uuid()),
      );

      expect(statesOf(lessons, progress)[27]).toBe("current");
    });
  });
});

describe("deriveModuleRoute — module totals", () => {
  describe("GIVEN 5 of 17 lessons finished", () => {
    test("WHEN the route is derived THEN it counts 5 finished of 17", () => {
      const lessons = makeLessons(17);
      const progress = progressWith({ completed: lessons.slice(0, 5).map((lesson) => lesson.id) });

      const route = deriveModuleRoute(lessons, progress);

      expect(route.finishedCount).toBe(5);
      expect(route.lessonCount).toBe(17);
    });
  });

  describe("GIVEN one lesson finished and another watched to 240 of 600 seconds", () => {
    test("WHEN the route is derived THEN 360 seconds are left", () => {
      const lessons = makeLessons(2);
      const progress = progressWith({
        completed: [lessons[0]!.id],
        positions: [[lessons[1]!.id, 240]],
      });

      expect(deriveModuleRoute(lessons, progress).secondsLeft).toBe(360);
    });
  });

  describe("GIVEN a module holding a reading lesson", () => {
    test("WHEN the route is derived THEN the reading lesson adds no time left", () => {
      const [video] = makeLessons(1);
      const reading: RouteLesson = {
        id: LessonId.parse(faker.string.uuid()),
        sequence: 2,
        durationSeconds: 0,
      };

      expect(deriveModuleRoute([video!, reading], progressWith({})).secondsLeft).toBe(
        LESSON_DURATION_SECONDS,
      );
    });
  });

  describe("GIVEN every lesson finished", () => {
    test("WHEN the route is derived THEN nothing is left to watch", () => {
      const lessons = makeLessons(3);
      const progress = progressWith({ completed: lessons.map((lesson) => lesson.id) });

      expect(deriveModuleRoute(lessons, progress).secondsLeft).toBe(0);
    });
  });

  describe("GIVEN a module holding no lessons", () => {
    test("WHEN the route is derived THEN every total is zero", () => {
      expect(deriveModuleRoute([], progressWith({}))).toEqual({
        steps: [],
        finishedCount: 0,
        lessonCount: 0,
        secondsLeft: 0,
      });
    });
  });
});
