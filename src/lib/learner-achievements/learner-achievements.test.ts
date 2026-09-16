import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { learnerAchievements, ticketSymbol, type AchievementLevel } from "./learner-achievements";

describe("ticketSymbol", () => {
  test("WHEN the title names one sound between slashes THEN the ticket shows that sound", () => {
    expect(ticketSymbol("The Vowel Sound /ɪ/ (e corta)", 2)).toBe("ɪ");
  });

  test("WHEN the title names two sounds THEN the ticket shows the first", () => {
    expect(ticketSymbol("Schwa /ə/ or Strut /ʌ/ ?", 4)).toBe("ə");
  });

  test("WHEN the title names no sound THEN the ticket shows the lesson's position", () => {
    const position = faker.number.int({ min: 1, max: 30 });

    expect(ticketSymbol("The weak-vowel merger", position)).toBe(String(position));
  });

  test("WHEN the slashes hold only spaces THEN the ticket shows the lesson's position", () => {
    expect(ticketSymbol("Rhythm / / drills", 3)).toBe("3");
  });
});

const aCourse = (sequence = 1): Course =>
  Course.parse({
    id: CourseId.parse(faker.string.uuid()),
    slug: `course-${sequence}`,
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    language: "en",
    lessonCount: 0,
    moduleCount: 0,
    sequence,
  });

const aModule = (course: Course, sequence: number, slug = `module-${sequence}`): Module =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug,
    title: faker.lorem.words(2),
    sequence,
  });

const aLesson = (module: Module, sequence: number, title = faker.lorem.words(3)) =>
  ({
    id: LessonId.parse(faker.string.uuid()),
    moduleId: module.id,
    durationSeconds: 300,
    title,
    sequence,
  }) satisfies LessonProgressSlice;

const lessonsOf = (module: Module, count: number) =>
  Array.from({ length: count }, (_, index) => aLesson(module, index + 1));

const earnedAmong = (earned: ReadonlyArray<LessonProgressSlice>) => {
  const earnedIds = new Set(earned.map((lesson) => lesson.id));
  return (lesson: LessonProgressSlice) => earnedIds.has(lesson.id);
};

const claimedAmong = (claimed: ReadonlyArray<Module>) => {
  const claimedSlugs = new Set(claimed.map((module) => module.slug));
  return (module: Module) => claimedSlugs.has(module.slug);
};

/** Nothing claimed — the state most cases start from. */
const nothingClaimed = () => false;

describe("learnerAchievements", () => {
  describe("GIVEN a module's lessons listed out of order", () => {
    test("WHEN achievements are derived THEN its tickets follow lesson sequence AND carry their symbols", () => {
      // Arrange
      const course = aCourse();
      const vowels = aModule(course, 1);
      const schwa = aLesson(vowels, 1, "The Vowel Sound: /ə/ (El más importante)");
      const merger = aLesson(vowels, 2, "The weak-vowel merger");
      const level: AchievementLevel = {
        course,
        modules: [vowels],
        lessonRuntimes: [merger, schwa],
      };

      // Act
      const achievements = learnerAchievements({
        levels: [level],
        isEarned: earnedAmong([schwa]),
        isClaimed: nothingClaimed,
      });

      // Assert
      expect(achievements.courses[0]?.modules[0]?.tickets).toEqual([
        { lessonId: schwa.id, title: schwa.title, symbol: "ə", isEarned: true },
        { lessonId: merger.id, title: merger.title, symbol: "2", isEarned: false },
      ]);
    });
  });

  describe("GIVEN modules with every, some and none of their tickets earned", () => {
    test("WHEN none of them is claimed THEN their prizes are ready, collecting and locked", () => {
      // Arrange
      const course = aCourse();
      const introduction = aModule(course, 1);
      const vowels = aModule(course, 2);
      const consonants = aModule(course, 3);
      const introductionLessons = lessonsOf(introduction, 1);
      const vowelLessons = lessonsOf(vowels, 17);
      const level: AchievementLevel = {
        course,
        modules: [introduction, vowels, consonants],
        lessonRuntimes: [...introductionLessons, ...vowelLessons, ...lessonsOf(consonants, 25)],
      };
      const isEarned = earnedAmong([...introductionLessons, ...vowelLessons.slice(0, 12)]);

      // Act
      const { courses } = learnerAchievements({
        levels: [level],
        isEarned,
        isClaimed: nothingClaimed,
      });

      // Assert
      expect(
        courses[0]?.modules.map(({ module, prizeState, ticketsEarned, tickets }) => ({
          id: module.id,
          prizeState,
          ticketsEarned,
          ticketCount: tickets.length,
        })),
      ).toEqual([
        { id: introduction.id, prizeState: "ready", ticketsEarned: 1, ticketCount: 1 },
        { id: vowels.id, prizeState: "collecting", ticketsEarned: 12, ticketCount: 17 },
        { id: consonants.id, prizeState: "locked", ticketsEarned: 0, ticketCount: 25 },
      ]);
    });
  });

  describe("GIVEN a module whose prize the learner has claimed", () => {
    test("WHEN achievements are derived THEN its prize is claimed AND it counts among the prizes redeemed", () => {
      // Arrange
      const course = aCourse();
      const introduction = aModule(course, 1);
      const lessons = lessonsOf(introduction, 1);
      const level: AchievementLevel = {
        course,
        modules: [introduction],
        lessonRuntimes: lessons,
      };

      // Act
      const achievements = learnerAchievements({
        levels: [level],
        isEarned: earnedAmong(lessons),
        isClaimed: claimedAmong([introduction]),
      });

      // Assert
      expect(achievements.courses[0]?.modules[0]?.prizeState).toBe("claimed");
      expect(achievements.prizesRedeemed).toBe(1);
    });

    test("WHEN a lesson of that module loses its completion THEN the prize stays claimed", () => {
      // Arrange — the tickets were already exchanged for the toy.
      const course = aCourse();
      const vowels = aModule(course, 1);
      const lessons = lessonsOf(vowels, 3);
      const level: AchievementLevel = { course, modules: [vowels], lessonRuntimes: lessons };

      // Act
      const achievements = learnerAchievements({
        levels: [level],
        isEarned: earnedAmong(lessons.slice(0, 2)),
        isClaimed: claimedAmong([vowels]),
      });

      // Assert
      expect(achievements.courses[0]?.modules[0]?.prizeState).toBe("claimed");
      expect(achievements.prizesRedeemed).toBe(1);
    });
  });

  describe("GIVEN a module with a catalogued slug", () => {
    test("WHEN achievements are derived THEN the module carries its catalogued prize", () => {
      // Arrange
      const course = aCourse();
      const vowels = aModule(course, 2, "2-vowels");
      const level: AchievementLevel = {
        course,
        modules: [vowels],
        lessonRuntimes: lessonsOf(vowels, 2),
      };

      // Act
      const { courses } = learnerAchievements({
        levels: [level],
        isEarned: () => false,
        isClaimed: nothingClaimed,
      });

      // Assert
      expect(courses[0]?.modules[0]?.prize).toBe("harmonica");
    });
  });

  describe("GIVEN a module that holds no lessons", () => {
    test("WHEN achievements are derived THEN it has no prize", () => {
      // Arrange
      const course = aCourse();
      const empty = aModule(course, 1);
      const vowels = aModule(course, 2);
      const level: AchievementLevel = {
        course,
        modules: [empty, vowels],
        lessonRuntimes: lessonsOf(vowels, 2),
      };

      // Act
      const { courses } = learnerAchievements({
        levels: [level],
        isEarned: () => false,
        isClaimed: nothingClaimed,
      });

      // Assert
      expect(courses[0]?.modules.map(({ module }) => module.id)).toEqual([vowels.id]);
    });
  });

  describe("GIVEN a course whose modules are listed out of order", () => {
    test("WHEN achievements are derived THEN its prizes follow module sequence", () => {
      // Arrange
      const course = aCourse();
      const first = aModule(course, 1);
      const second = aModule(course, 2);
      const level: AchievementLevel = {
        course,
        modules: [second, first],
        lessonRuntimes: [...lessonsOf(second, 1), ...lessonsOf(first, 1)],
      };

      // Act
      const { courses } = learnerAchievements({
        levels: [level],
        isEarned: () => false,
        isClaimed: nothingClaimed,
      });

      // Assert
      expect(courses[0]?.modules.map(({ module }) => module.id)).toEqual([first.id, second.id]);
    });
  });

  describe("GIVEN a catalog of two courses and a module without lessons", () => {
    test("WHEN achievements are derived THEN the totals span every lesson AND count only claimed prizes", () => {
      // Arrange
      const basic = aCourse(1);
      const introduction = aModule(basic, 1);
      const vowels = aModule(basic, 2);
      const empty = aModule(basic, 3);
      const advanced = aCourse(2);
      // A slug of its own: claims are keyed by slug, so a module sharing one
      // with another course's module would be claimed alongside it.
      const intonation = aModule(advanced, 1, "advanced-module-1");
      const introductionLessons = lessonsOf(introduction, 1);
      const vowelLessons = lessonsOf(vowels, 17);
      const levels: AchievementLevel[] = [
        {
          course: basic,
          modules: [introduction, vowels, empty],
          lessonRuntimes: [...introductionLessons, ...vowelLessons],
        },
        { course: advanced, modules: [intonation], lessonRuntimes: lessonsOf(intonation, 6) },
      ];
      const isEarned = earnedAmong([...introductionLessons, ...vowelLessons.slice(0, 12)]);

      // Act
      const achievements = learnerAchievements({
        levels,
        isEarned,
        isClaimed: claimedAmong([introduction]),
      });

      // Assert
      expect(achievements).toMatchObject({
        ticketsEarned: 13,
        ticketCount: 24,
        prizesRedeemed: 1,
        prizeCount: 3,
      });
    });

    test("WHEN a module holds every ticket but is unclaimed THEN it is not counted as redeemed", () => {
      // Arrange
      const course = aCourse();
      const introduction = aModule(course, 1);
      const lessons = lessonsOf(introduction, 1);
      const level: AchievementLevel = { course, modules: [introduction], lessonRuntimes: lessons };

      // Act
      const achievements = learnerAchievements({
        levels: [level],
        isEarned: earnedAmong(lessons),
        isClaimed: nothingClaimed,
      });

      // Assert
      expect(achievements).toMatchObject({ prizesRedeemed: 0, prizeCount: 1 });
    });
  });
});

describe("the learner's distinction", () => {
  const twoCourses = () => {
    const basic = aCourse(1);
    const basicModule = aModule(basic, 1);
    const advanced = aCourse(2);
    const advancedModule = aModule(advanced, 1);
    const basicLessons = lessonsOf(basicModule, 2);
    const advancedLessons = lessonsOf(advancedModule, 2);
    const levels: AchievementLevel[] = [
      { course: basic, modules: [basicModule], lessonRuntimes: basicLessons },
      { course: advanced, modules: [advancedModule], lessonRuntimes: advancedLessons },
    ];
    return { levels, basicLessons, advancedLessons };
  };

  test("WHEN no course is complete THEN the learner is a student", () => {
    const { levels, basicLessons } = twoCourses();

    const { distinction } = learnerAchievements({
      levels,
      isEarned: earnedAmong(basicLessons.slice(0, 1)),
      isClaimed: nothingClaimed,
    });

    expect(distinction).toBe("student");
  });

  test("WHEN one of two courses is complete THEN the learner holds bronze", () => {
    const { levels, basicLessons } = twoCourses();

    const { distinction } = learnerAchievements({
      levels,
      isEarned: earnedAmong(basicLessons),
      isClaimed: nothingClaimed,
    });

    expect(distinction).toBe("bronze");
  });

  test("WHEN every course holding lessons is complete THEN the learner holds gold, claimed or not", () => {
    const { levels, basicLessons, advancedLessons } = twoCourses();
    const lessonless: AchievementLevel = { course: aCourse(3), modules: [], lessonRuntimes: [] };

    const { distinction } = learnerAchievements({
      levels: [...levels, lessonless],
      isEarned: earnedAmong([...basicLessons, ...advancedLessons]),
      isClaimed: nothingClaimed,
    });

    expect(distinction).toBe("gold");
  });

  test("WHEN no course holds lessons THEN the learner is a student", () => {
    const lessonless: AchievementLevel = { course: aCourse(), modules: [], lessonRuntimes: [] };

    const { distinction } = learnerAchievements({
      levels: [lessonless],
      isEarned: () => true,
      isClaimed: nothingClaimed,
    });

    expect(distinction).toBe("student");
  });
});
