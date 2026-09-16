import { LessonId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { moduleEntryPath } from "./lesson-routes";

const course = { slug: Slug.parse("basic-course") };
const fluency = { slug: Slug.parse("5-fluidez-y-velocidad") };
const aLesson = () => ({ id: LessonId.parse(faker.string.uuid()) });

describe("moduleEntryPath", () => {
  test("WHEN the lesson (module) holds a single video THEN it opens that video's page", () => {
    const onlyVideo = aLesson();

    expect(moduleEntryPath(course, fluency, [onlyVideo])).toBe(
      `/courses/basic-course/modules/5-fluidez-y-velocidad/lessons/${onlyVideo.id}`,
    );
  });

  test("WHEN the lesson (module) holds several videos THEN it opens its overview", () => {
    const consonants = { slug: Slug.parse("3-consonants") };

    expect(moduleEntryPath(course, consonants, [aLesson(), aLesson()])).toBe(
      "/courses/basic-course/modules/3-consonants",
    );
  });

  test("WHEN the lesson (module) holds no videos THEN it opens its overview", () => {
    expect(moduleEntryPath(course, fluency, [])).toBe(
      "/courses/basic-course/modules/5-fluidez-y-velocidad",
    );
  });
});
