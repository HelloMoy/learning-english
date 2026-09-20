import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the `search-discoverability` capability.
 *
 * Like the sharing metadata, none of this is visible in the running app: a
 * sitemap that silently omits every lesson, or that advertises a withheld
 * course, looks like nothing at all from the browser.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const FIRST_LESSON = contentCatalog.lessonRows
  .filter((lesson) => lesson.moduleId === FIRST_MODULE.id)
  .sort((a, b) => a.sequence - b.sequence)[0]!;

/** Every JSON-LD payload on the current page, parsed. */
async function linkedData(page: import("@playwright/test").Page): Promise<unknown[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.map((text) => JSON.parse(text));
}

test.describe("robots", () => {
  test("WHEN robots.txt is requested THEN it is served as plain text", async ({ request }) => {
    const response = await request.get("/robots.txt");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/text\/plain/);
    expect(await response.text()).toContain("User-Agent: *");
  });

  test("WHEN this deployment is not production THEN crawling is disallowed", async ({
    request,
  }) => {
    // The dev server sets no VERCEL_ENV, which is the fail-closed branch: a
    // local or preview deployment is a duplicate of production and must never
    // be indexed.
    const body = await (await request.get("/robots.txt")).text();

    expect(body).toContain("Disallow: /");
  });
});

test.describe("sitemap", () => {
  test("WHEN the sitemap is requested THEN it lists the home of every locale and nothing else", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/xml/);

    const body = await response.text();
    const listed = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, url]) => new URL(url).pathname,
    );
    expect(listed.sort()).toEqual(["/en", "/es", "/pt"]);
  });

  test("WHEN an entry is read THEN it declares its locale alternates", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();

    for (const locale of ["en", "es", "pt"] as const) {
      expect(body).toContain(`hreflang="${locale}"`);
    }
  });

  test("WHEN courses require a session THEN no course URL is advertised", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();

    expect(body).not.toContain("/courses/");
  });
});

test.describe("structured data", () => {
  test("WHEN any page renders THEN it describes the site and its publisher", async ({ page }) => {
    await page.goto("/en");

    const website = (await linkedData(page)).find(
      (entry) => (entry as { "@type": string })["@type"] === "WebSite",
    );
    expect(website).toMatchObject({ name: "English Course" });
  });

  test("WHEN a course page renders THEN it describes the course and its trail", async ({
    page,
  }) => {
    await page.goto(`/en/courses/${COURSE_SLUG}`);
    const data = await linkedData(page);

    const course = data.find((entry) => (entry as { "@type": string })["@type"] === "Course");
    expect(course).toMatchObject({
      "@context": "https://schema.org",
      provider: { "@type": "Organization", name: "English Course" },
    });

    expect(
      data.find((entry) => (entry as { "@type": string })["@type"] === "BreadcrumbList"),
    ).toBeDefined();
  });

  test("WHEN a lesson declares no upload date THEN no VideoObject is emitted", async ({ page }) => {
    // No manifest declares an upload date yet, so every lesson takes this
    // branch. Emitting `VideoObject` without a date is markup Google rejects.
    await page.goto(
      `/en/courses/${COURSE_SLUG}/modules/${FIRST_MODULE.slug}/lessons/${FIRST_LESSON.id}`,
    );
    const data = await linkedData(page);

    expect(
      data.find((entry) => (entry as { "@type": string })["@type"] === "VideoObject"),
    ).toBeUndefined();
    expect(
      data.find((entry) => (entry as { "@type": string })["@type"] === "BreadcrumbList"),
    ).toBeDefined();
  });

  test("WHEN structured data is read THEN nothing is invented", async ({ page }) => {
    await page.goto(`/en/courses/${COURSE_SLUG}`);
    const serialized = JSON.stringify(await linkedData(page));

    for (const forbidden of ["aggregateRating", "review", "offers", "price"]) {
      expect(serialized, `${forbidden} must not be published`).not.toContain(forbidden);
    }
  });
});
