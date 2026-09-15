import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import type { CourseCatalogEntry } from "@/domain/use-cases/find-course-catalog/find-course-catalog";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { homeFirstLesson } from "./home-first-lesson";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 1,
  moduleCount: 1,
  sequence: 1,
});

const module_ = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "1-introduction",
  title: "Introduction",
  sequence: 1,
});

const videoLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId: course.id,
  moduleId: module_.id,
  sequence: 1,
  title: "Introduction",
  description: faker.lorem.sentence(),
  source: "/videos/introduction.mp4",
  durationSeconds: 491,
});

const entryWith = (firstLesson: Lesson | null): CourseCatalogEntry => ({
  course,
  firstLesson,
  modules: [module_],
  lessonRuntimes: [],
});

describe("homeFirstLesson", () => {
  test("WHEN the first course opens with a video THEN it links to that lesson and rounds its runtime to minutes", () => {
    expect(homeFirstLesson([entryWith(videoLesson)])).toEqual({
      href: `/courses/basic-course/modules/1-introduction/lessons/${videoLesson.id}`,
      minutes: 8,
      courseTitle: "Basic Course",
    });
  });

  test("WHEN the first lesson is a reading lesson THEN it carries no minutes", () => {
    const reading = Lesson.parse({
      kind: "reading",
      id: videoLesson.id,
      courseId: course.id,
      moduleId: module_.id,
      sequence: 1,
      title: "Read me",
      body: "Body",
    });

    expect(homeFirstLesson([entryWith(reading)])?.minutes).toBeNull();
  });

  test("WHEN the catalog is empty or its first course has no lesson THEN there is nothing to link to", () => {
    expect(homeFirstLesson([])).toBeNull();
    expect(homeFirstLesson([entryWith(null)])).toBeNull();
  });
});
