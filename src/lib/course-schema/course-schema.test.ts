import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { breadcrumbSchema, courseSchema, videoSchema, websiteSchema } from "./course-schema";

/**
 * Guards the `search-discoverability` capability's "the catalog is described as
 * structured data" requirement.
 *
 * Two things here are not stylistic. `VideoObject` must be absent without an
 * upload date, because Google rejects the type without one and invalid markup
 * is worse than none. And no builder may ever emit a rating, review or offer —
 * that is the category of markup sites get penalised for, and the catalog holds
 * none of it.
 */
const SITE = "https://english-course.online";

const aCourse = () => ({
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  slug: "basic-course",
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
});

describe("courseSchema", () => {
  test("describes the course in schema.org's vocabulary", () => {
    const course = aCourse();

    const schema = courseSchema({ course, siteUrl: SITE, locale: "en" });

    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description,
      inLanguage: course.language,
      url: `${SITE}/en/courses/basic-course`,
    });
    expect(schema.provider).toMatchObject({ "@type": "Organization", name: "English Course" });
  });

  test("claims no rating, review, offer or price", () => {
    const serialized = JSON.stringify(
      courseSchema({ course: aCourse(), siteUrl: SITE, locale: "en" }),
    );

    for (const forbidden of ["aggregateRating", "review", "offers", "price"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  test("states no workload, which the catalog does not measure", () => {
    // Lesson count is not hours. Deriving one from the other would publish a
    // duration nobody measured.
    const serialized = JSON.stringify(
      courseSchema({ course: aCourse(), siteUrl: SITE, locale: "en" }),
    );

    expect(serialized).not.toContain("courseWorkload");
  });
});

describe("videoSchema", () => {
  test("is absent for a Lecture that declares no upload date", () => {
    const schema = videoSchema({
      lesson: { title: "Welcome", description: "…", durationSeconds: 491, kind: "video" },
      siteUrl: SITE,
      locale: "en",
      url: `${SITE}/en/lesson`,
    });

    expect(schema).toBeNull();
  });

  test("describes the video when the lesson declares one", () => {
    const schema = videoSchema({
      lesson: {
        title: "Welcome",
        description: "An introduction.",
        durationSeconds: 491,
        kind: "video",
        uploadDate: "2026-01-15",
      },
      siteUrl: SITE,
      locale: "en",
      url: `${SITE}/en/lesson`,
    });

    expect(schema).toMatchObject({
      "@type": "VideoObject",
      name: "Welcome",
      uploadDate: "2026-01-15",
      // ISO 8601 is the only duration form schema.org accepts. 491s = 8m11s.
      duration: "PT8M11S",
    });
  });

  test.each([
    [491, "PT8M11S"],
    [60, "PT1M"],
    [59, "PT59S"],
    [3661, "PT1H1M1S"],
  ])("formats %i seconds as %s", (durationSeconds, expected) => {
    const schema = videoSchema({
      lesson: {
        title: "t",
        description: "d",
        durationSeconds,
        kind: "video",
        uploadDate: "2026-01-15",
      },
      siteUrl: SITE,
      locale: "en",
      url: `${SITE}/en/lesson`,
    });

    expect(schema).toMatchObject({ duration: expected });
  });
});

describe("breadcrumbSchema", () => {
  test("numbers the trail from one, in order", () => {
    const schema = breadcrumbSchema([
      { name: "Basic Course", url: `${SITE}/en/courses/basic-course` },
      { name: "Introduction", url: `${SITE}/en/courses/basic-course/modules/1-introduction` },
    ]);

    expect(schema.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(schema.itemListElement[0]).toMatchObject({ name: "Basic Course" });
  });
});

describe("websiteSchema", () => {
  test("names the site and its publisher", () => {
    const schema = websiteSchema({ siteUrl: SITE, locale: "en" });

    expect(schema).toMatchObject({ "@type": "WebSite", name: "English Course", url: SITE });
    expect(schema.publisher).toMatchObject({ "@type": "Organization", name: "English Course" });
  });
});
