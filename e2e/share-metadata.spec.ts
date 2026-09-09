import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test } from "@playwright/test";

import { moduleOfCourse, modulesOfCourse } from "./content-seed-fixtures";

/**
 * E2E coverage for the `site-metadata` capability.
 *
 * These tags are invisible in a running app: a page that quietly lost its
 * canonical, or that published the home page's description on every lesson,
 * looks identical in the browser. Reading the real head is the only way to
 * know, so this suite asserts the rendered document rather than the builder —
 * `share-metadata.test.ts` already covers the builder in isolation.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
// A Lecture specifically: the video tags only exist for `kind: "video"`, and
// the reading branch of the union carries no `durationSeconds`.
type VideoLessonRow = Extract<(typeof contentCatalog.lessonRows)[number], { kind: "video" }>;

const FIRST_LESSON = contentCatalog.lessonRows
  .filter(
    (lesson): lesson is VideoLessonRow =>
      lesson.moduleId === FIRST_MODULE.id && lesson.kind === "video",
  )
  .sort((a, b) => a.sequence - b.sequence)[0]!;

const NOTES_MODULE = moduleOfCourse(COURSE_SLUG, "3-contractions-reductions");

const COURSE_PATH = `/courses/${COURSE_SLUG}`;
const MODULE_PATH = `${COURSE_PATH}/modules/${NOTES_MODULE.slug}`;
const LESSON_PATH = `${COURSE_PATH}/modules/${FIRST_MODULE.slug}/lessons/${FIRST_LESSON.id}`;

/** The `content` of a `<meta>` addressed by `property` or `name`. */
async function metaContent(
  page: import("@playwright/test").Page,
  key: string,
): Promise<string | null> {
  return page
    .locator(`meta[property="${key}"], meta[name="${key}"]`)
    .first()
    .getAttribute("content");
}

test.describe("site metadata — canonical and locale alternates", () => {
  for (const locale of ["en", "es", "pt"] as const) {
    test(`WHEN ${locale} renders a course THEN it declares its own canonical and every alternate`, async ({
      page,
    }) => {
      await page.goto(`/${locale}${COURSE_PATH}`);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`/${locale}${COURSE_PATH}$`),
      );

      for (const [hreflang, expectedLocale] of [
        ["en", "en"],
        ["es", "es"],
        ["pt", "pt"],
        ["x-default", "en"],
      ] as const) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveAttribute(
          "href",
          new RegExp(`/${expectedLocale}${COURSE_PATH}$`),
        );
      }
    });
  }
});

test.describe("site metadata — Open Graph and Twitter", () => {
  test("WHEN each route kind renders THEN it describes itself rather than the site", async ({
    page,
  }) => {
    await page.goto("/en");
    const homeTitle = await metaContent(page, "og:title");
    const homeDescription = await metaContent(page, "og:description");

    await page.goto(`/en${COURSE_PATH}`);
    const courseTitle = await metaContent(page, "og:title");
    const courseDescription = await metaContent(page, "og:description");

    await page.goto(`/en${LESSON_PATH}`);
    const lessonTitle = await metaContent(page, "og:title");
    const lessonDescription = await metaContent(page, "og:description");

    expect(new Set([homeTitle, courseTitle, lessonTitle]).size).toBe(3);
    expect(new Set([homeDescription, courseDescription, lessonDescription]).size).toBe(3);
    expect(lessonTitle).toBe(FIRST_LESSON.title);
  });

  test("WHEN a page renders in any locale THEN the site name is the untranslated brand", async ({
    page,
  }) => {
    for (const locale of ["en", "es", "pt"] as const) {
      await page.goto(`/${locale}${MODULE_PATH}`);
      expect(await metaContent(page, "og:site_name")).toBe("English Course");
    }
  });

  test("WHEN a locale renders THEN og:locale names it and the other two are alternates", async ({
    page,
  }) => {
    await page.goto(`/es${COURSE_PATH}`);

    expect(await metaContent(page, "og:locale")).toBe("es_ES");
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(2);
  });

  test("WHEN a video lesson renders THEN it declares a video type and its own duration", async ({
    page,
  }) => {
    await page.goto(`/en${LESSON_PATH}`);

    expect(await metaContent(page, "og:type")).toBe("video.other");
    expect(await metaContent(page, "og:video:duration")).toBe(String(FIRST_LESSON.durationSeconds));
  });

  test("WHEN any page renders THEN no empty Twitter handles are published", async ({ page }) => {
    await page.goto(`/en${COURSE_PATH}`);

    expect(await metaContent(page, "twitter:card")).toBe("summary_large_image");
    await expect(page.locator('meta[name="twitter:site"]')).toHaveCount(0);
    await expect(page.locator('meta[name="twitter:creator"]')).toHaveCount(0);
  });

  test("WHEN a route renders THEN it declares its own sized image with alt text", async ({
    page,
  }) => {
    await page.goto(`/en${COURSE_PATH}`);

    expect(await metaContent(page, "og:image")).toMatch(
      new RegExp(`/en${COURSE_PATH}/opengraph-image`),
    );
    expect(await metaContent(page, "og:image:width")).toBe("1200");
    expect(await metaContent(page, "og:image:height")).toBe("630");
    expect(await metaContent(page, "og:image:alt")).toContain("English Course");
    expect(await metaContent(page, "twitter:image")).toMatch(/opengraph-image/);
  });
});

test.describe("site metadata — generated sharing images", () => {
  test("WHEN each image route is requested THEN it renders a PNG card", async ({ request }) => {
    for (const path of ["", COURSE_PATH, MODULE_PATH, LESSON_PATH] as const) {
      const response = await request.get(`/en${path}/opengraph-image`);
      expect(response.status(), `/en${path}/opengraph-image should render`).toBe(200);
      expect(response.headers()["content-type"]).toMatch(/image\/png/);
      // A card that rendered nothing still returns 200; a real one is far
      // larger than an empty canvas.
      expect((await response.body()).length).toBeGreaterThan(10_000);
    }
  });
});

test.describe("site metadata — withheld courses", () => {
  /**
   * A course withheld from the served catalog must be withheld here too. The
   * image route resolves through the same use case as the page, so this asserts
   * the two *agree* rather than asserting a fixed status: in development drafts
   * are visible and both succeed, in production both refuse. What would be a
   * bug is the image route rendering a card for a course whose page does not.
   */
  test("WHEN a course is withheld from its page THEN its image route is withheld too", async ({
    request,
  }) => {
    const draftCourse = "/en/courses/advanced-intermediate-course";

    const page = await request.get(draftCourse);
    const image = await request.get(`${draftCourse}/opengraph-image`);

    expect(image.status() === 200).toBe(page.status() === 200);
  });

  test("WHEN a course does not exist THEN its image route refuses", async ({ request }) => {
    const response = await request.get("/en/courses/no-such-course/opengraph-image");

    expect(response.status()).toBe(404);
  });
});

test.describe("site metadata — document title", () => {
  test("WHEN a lesson renders THEN its title carries the brand", async ({ page }) => {
    await page.goto(`/en${LESSON_PATH}`);

    await expect(page).toHaveTitle(`${FIRST_LESSON.title} · English Course`);
  });
});

test.describe("site metadata — icons and manifest", () => {
  test("WHEN the manifest is requested THEN it names the brand and starts on a locale", async ({
    request,
  }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe("English Course");
    // Not "/": `localePrefix: always` makes the bare origin a redirect, which an
    // installed app would pay for on every cold start.
    expect(manifest.start_url).toBe("/en");
    expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");
  });

  test("WHEN the icon files are requested THEN each is served as an image", async ({ request }) => {
    for (const [path, type] of [
      ["/favicon.ico", /icon|image/],
      ["/icon-192.png", /image\/png/],
      ["/icon-512.png", /image\/png/],
      ["/icon-512-maskable.png", /image\/png/],
    ] as const) {
      const response = await request.get(path);
      expect(response.status(), `${path} should be served`).toBe(200);
      expect(response.headers()["content-type"]).toMatch(type);
    }
  });

  test("WHEN a page renders THEN it links its own icon, not the framework default", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /.+/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  });
});

test.describe("site metadata — theme colour", () => {
  test("WHEN a page renders THEN a theme colour is declared for each theme", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  });
});
