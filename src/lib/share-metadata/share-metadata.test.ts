import { routing } from "@/i18n/routing";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { shareMetadata } from "./share-metadata";

/**
 * Guards the `site-metadata` capability's "every route publishes Open Graph and
 * Twitter Card metadata" and "declares its canonical URL and its locale
 * alternates" requirements.
 *
 * The builder is pure, so it is asserted directly rather than through a
 * rendered page. Titles and descriptions come from faker — their content is
 * irrelevant, only that they are carried through. The locale codes and the
 * brand are hardcoded, because those exact values are what the test is about.
 */

const anInput = (overrides: Partial<Parameters<typeof shareMetadata>[0]> = {}) => ({
  locale: "en" as const,
  href: "/courses/basic-course",
  title: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  siteName: "English Course",
  imageAlt: faker.lorem.words(4),
  ...overrides,
});

describe("shareMetadata", () => {
  test("assumes the locale prefix the routing configuration actually declares", () => {
    // `localePath` hardcodes the `/{locale}{href}` shape. If this ever stops
    // being "always", every canonical and hreflang the builder emits is wrong.
    expect(routing.localePrefix).toBe("always");
  });

  test("declares the canonical URL for the locale it is rendered in", () => {
    const metadata = shareMetadata(anInput({ locale: "es" }));

    expect(metadata.alternates?.canonical).toBe("/es/courses/basic-course");
  });

  test("declares an alternate for every locale plus x-default", () => {
    const metadata = shareMetadata(anInput());

    expect(metadata.alternates?.languages).toEqual({
      en: "/en/courses/basic-course",
      es: "/es/courses/basic-course",
      pt: "/pt/courses/basic-course",
      "x-default": "/en/courses/basic-course",
    });
  });

  test("carries the route's own title and description into Open Graph", () => {
    const input = anInput();
    const metadata = shareMetadata(input);

    expect(metadata.openGraph?.title).toBe(input.title);
    expect(metadata.openGraph?.description).toBe(input.description);
    expect(metadata.title).toBe(input.title);
  });

  test("names the brand as the site name whatever the locale", () => {
    for (const locale of ["en", "es", "pt"] as const) {
      expect(shareMetadata(anInput({ locale })).openGraph?.siteName).toBe("English Course");
    }
  });

  test.each([
    ["en", "en_US", ["es_ES", "pt_BR"]],
    ["es", "es_ES", ["en_US", "pt_BR"]],
    ["pt", "pt_BR", ["en_US", "es_ES"]],
  ] as const)("maps %s to %s and lists the others as alternates", (locale, primary, others) => {
    const openGraph = shareMetadata(anInput({ locale })).openGraph;

    expect(openGraph?.locale).toBe(primary);
    expect(openGraph?.alternateLocale).toEqual(others);
  });

  test("declares a large-image Twitter card with the image alt text", () => {
    const input = anInput();
    const metadata = shareMetadata(input);

    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    });
  });

  test("omits handles entirely rather than publishing empty ones", () => {
    const twitter = shareMetadata(anInput()).twitter ?? {};

    expect(twitter).not.toHaveProperty("site");
    expect(twitter).not.toHaveProperty("creator");
  });

  test("declares the route's own generated image, sized, on both cards", () => {
    const input = anInput({ locale: "es" });
    const metadata = shareMetadata(input);

    const expected = [
      {
        url: "/es/courses/basic-course/opengraph-image",
        width: 1200,
        height: 630,
        alt: input.imageAlt,
      },
    ];
    expect(metadata.openGraph).toMatchObject({ images: expected });
    expect(metadata.twitter).toMatchObject({ images: expected });
  });

  test("refuses a locale the application does not serve", () => {
    expect(() => shareMetadata(anInput({ locale: "fr" }))).toThrow(/fr/);
  });

  test("declares a video type and duration for a lesson that has one", () => {
    const metadata = shareMetadata(anInput({ videoDurationSeconds: 491 }));

    expect(metadata.openGraph).toMatchObject({ type: "video.other" });
    // Not on `openGraph`: Next accepts `duration` there and then drops it from
    // the rendered head for `video.other`. See the comment in the builder.
    expect(metadata.other).toEqual({ "og:video:duration": "491" });
  });

  test("declares the default type and no duration without one", () => {
    const metadata = shareMetadata(anInput());

    expect(metadata.openGraph).toMatchObject({ type: "website" });
    expect(metadata).not.toHaveProperty("other");
  });
});
