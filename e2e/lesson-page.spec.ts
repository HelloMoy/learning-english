import {
  seedContentLessonRows,
  seedContentModules,
  seedContentResourceRows,
} from "@/adapters/persistence/in-memory/seed/seed-content";

import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Lesson Page (capability: `lesson-page`).
 *
 * Fixtures come from the **content seed**, because `playwright.config.ts`
 * boots the webServer with `USE_COURSE_CONTENT_SEED=1` — the A1 seed in
 * `seed.ts` is not served there, so its URLs render "We couldn't find this
 * course." `course-catalog.spec.ts` resolves its fixtures the same way.
 *
 * Everything is derived from the generated seed module (slugs, ids, titles,
 * resource names) rather than hardcoded, so regenerating the seed keeps the
 * suite honest instead of silently asserting stale copy.
 *
 * Spec coverage:
 *   - "A valid route renders the Lesson Page"
 *   - "The page renders all regions when the view is resolved"
 *   - "The Up next card points to the next lesson"
 *   - "The Up next card shows the terminal state when the course is complete"
 *   - "The button starts in the 'Mark as complete' state"
 *   - "Clicking the button changes the label"
 *   - "An unknown course renders an error state" (via Next.js notFound())
 *   - "A lesson that does not belong to the module renders an error state"
 *   - Module-not-in-course variant
 */

const COURSE_SLUG = "advanced-intermediate-course";

const bySequence = <T extends { sequence: number }>(items: ReadonlyArray<T>): T[] =>
  [...items].sort((a, b) => a.sequence - b.sequence);

/**
 * Resolves a seed content key the way the running server does. The seed
 * stores keys, not URLs; `CONTENT_BASE_URL` is unset in
 * `playwright.config.ts`, so the default local prefix applies.
 */
const contentUrl = (key: string): string => `/local-filesystem-lesson/${key}`;

const MODULES = bySequence(seedContentModules);
const MODULE_A = MODULES[0]!;
const MODULE_B = MODULES[1]!;
const LAST_MODULE = MODULES[MODULES.length - 1]!;

const lessonsIn = (moduleId: string) =>
  bySequence(seedContentLessonRows.filter((lesson) => lesson.moduleId === moduleId));

const MODULE_A_LESSONS = lessonsIn(MODULE_A.id);

/**
 * The primary fixture is the first lesson in module A that carries a
 * resource — the "Resources" region assertion needs one to be meaningful,
 * and it must not be the module's last lesson so "up next stays inside the
 * module" is exercisable.
 */
const PRIMARY_LESSON = MODULE_A_LESSONS.find(
  (lesson, index) =>
    index < MODULE_A_LESSONS.length - 1 &&
    seedContentResourceRows.some((resource) => resource.lessonId === lesson.id),
)!;
const PRIMARY_RESOURCE = seedContentResourceRows.find(
  (resource) => resource.lessonId === PRIMARY_LESSON.id,
)!;
const LESSON_AFTER_PRIMARY = MODULE_A_LESSONS[MODULE_A_LESSONS.indexOf(PRIMARY_LESSON) + 1]!;

const LAST_LESSON_OF_MODULE_A = MODULE_A_LESSONS[MODULE_A_LESSONS.length - 1]!;
const FIRST_LESSON_OF_MODULE_B = lessonsIn(MODULE_B.id)[0]!;

const LAST_MODULE_LESSONS = lessonsIn(LAST_MODULE.id);
const FINAL_LESSON = LAST_MODULE_LESSONS[LAST_MODULE_LESSONS.length - 1]!;

function lessonUrl(locale: string, moduleSlug: string, lessonId: string): string {
  return `/${locale}/courses/${COURSE_SLUG}/modules/${moduleSlug}/lessons/${lessonId}`;
}

/**
 * Seed titles carry regex metacharacters (`/i/`, `I've`, parentheses), so
 * they must be escaped before being used as an accessible-name matcher.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("Lesson Page — happy path", () => {
  test("WHEN a valid route is visited THEN all regions render and the title is the lesson's title", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));

    // Document <title> reflects the resolved lesson.
    await expect(page).toHaveTitle(PRIMARY_LESSON.title);

    // Breadcrumb shows three segments.
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();

    // Outline (left aside) is present. It renders as a <nav> with an
    // accessible name of "Course outline".
    await expect(page.getByRole("navigation", { name: /course outline/i })).toBeVisible();

    // Native video player renders with the lesson source.
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("controls", "");

    // Resources card lists the seed resource attached to this lesson.
    await expect(page.getByRole("region", { name: /resources/i })).toBeVisible();
    await expect(page.getByText(PRIMARY_RESOURCE.title)).toBeVisible();

    // Up next card points to the next lesson in the same module.
    const upNext = page.getByRole("region", { name: /up next/i });
    await expect(upNext).toBeVisible();
    await expect(upNext.getByRole("link")).toHaveAttribute(
      "href",
      new RegExp(`/modules/${MODULE_A.slug}/lessons/${LESSON_AFTER_PRIMARY.id}`),
    );

    // Mark as complete button starts in the incomplete state.
    const markComplete = page.getByRole("button", { name: /mark as complete/i });
    await expect(markComplete).toBeVisible();
  });

  test("WHEN mark-as-complete is clicked THEN the label toggles", async ({ page }) => {
    await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));

    const button = page.getByRole("button", { name: /mark as complete/i });
    await button.click();

    // After click, the label changes and the button is pressed.
    await expect(page.getByRole("button", { name: /marked complete/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /marked complete/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

/**
 * Regression guard for the locale-prefixed resource link (change:
 * `fix-resource-links-locale-prefix`).
 *
 * A `Resource.url` is a static asset served from `public/` at the origin
 * root, never an in-app route. Rendering it through the locale-aware
 * `Link` prefixed `/en` onto the path and every Resources link 404'd.
 *
 * This must live at the e2e layer: next-intl applies the prefix during the
 * server render, so the defect is invisible to jsdom — the equivalent RTL
 * assertion passes both before and after the fix. See design.md §D2.
 */
test.describe("Lesson Page — resource links resolve", () => {
  const RESOURCES_OF_PRIMARY_LESSON = seedContentResourceRows.filter(
    (resource) => resource.lessonId === PRIMARY_LESSON.id,
  );

  for (const locale of ["en", "es"]) {
    test(`WHEN the ${locale} lesson page is visited THEN every resource link is unprefixed and fetches 200`, async ({
      page,
    }) => {
      await page.goto(lessonUrl(locale, MODULE_A.slug, PRIMARY_LESSON.id));

      // Covers both right-rail cards: the "Resources" card and the
      // "Lesson notes (source)" card render through the same ResourceItem,
      // and the seed attaches a readme.md notes resource to this lesson.
      expect(RESOURCES_OF_PRIMARY_LESSON.length).toBeGreaterThan(0);

      for (const resource of RESOURCES_OF_PRIMARY_LESSON) {
        const link = page.getByRole("link", { name: new RegExp(escapeRegExp(resource.title)) });

        // The seed stores a content KEY; the href is that key resolved by
        // the BlobStore the server booted with. `playwright.config.ts` sets
        // no CONTENT_BASE_URL, so the default local prefix applies — and no
        // locale segment is added.
        await expect(link).toHaveAttribute("href", contentUrl(resource.url));

        // ...and it actually resolves. This is the assertion the learner
        // cares about; the one above only explains a failure.
        const href = (await link.getAttribute("href"))!;
        const response = await page.request.get(href);
        expect(response.status(), `${resource.title} -> ${href}`).toBe(200);
      }
    });
  }
});

test.describe("Lesson Page — cross-module navigation", () => {
  test("WHEN the current lesson is the last in its module THEN up-next links to the first lesson of the next module", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", MODULE_A.slug, LAST_LESSON_OF_MODULE_A.id));

    const upNext = page.getByRole("region", { name: /up next/i });
    const link = upNext.getByRole("link");
    await expect(link).toHaveAttribute(
      "href",
      new RegExp(`/modules/${MODULE_B.slug}/lessons/${FIRST_LESSON_OF_MODULE_B.id}`),
    );
  });

  test("WHEN the current lesson is the last lesson of the last module THEN up-next shows the terminal message", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", LAST_MODULE.slug, FINAL_LESSON.id));

    const upNext = page.getByRole("region", { name: /up next/i });
    await expect(upNext.getByRole("link")).toHaveCount(0);
    await expect(upNext).toContainText(/end of the course/i);
  });
});

test.describe("Lesson Page — error states", () => {
  test("WHEN the URL contains an invalid UUID THEN the inline error state renders", async ({
    page,
  }) => {
    await page.goto(`/en/courses/${COURSE_SLUG}/modules/${MODULE_A.slug}/lessons/not-a-uuid`);

    // The localized error heading is shown with a "Go home" affordance.
    await expect(
      page.getByRole("heading", { name: /couldn't find this lesson in the module/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to home/i })).toBeVisible();
  });

  test("WHEN the course slug does not exist THEN the inline error state renders the course-specific message", async ({
    page,
  }) => {
    await page.goto(
      `/en/courses/does-not-exist/modules/${MODULE_A.slug}/lessons/${PRIMARY_LESSON.id}`,
    );

    // The page renders the course-specific inline error (not the
    // lesson-not-in-module fallback). The response stays 200 in dev
    // mode; the spec only requires the localized message and a home
    // link, not a 404 status.
    await expect(page).toHaveTitle(/^Not found$/);
    await expect(page.getByRole("heading", { name: /couldn't find this course/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /go to home/i })).toHaveAttribute("href", /\/en$/);
  });

  test("WHEN the module does not belong to the course THEN the inline error state renders", async ({
    page,
  }) => {
    await page.goto(
      `/en/courses/${COURSE_SLUG}/modules/does-not-exist/lessons/${PRIMARY_LESSON.id}`,
    );

    await expect(
      page.getByRole("heading", { name: /couldn't find this module in the course/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to home/i })).toBeVisible();
  });

  test("WHEN the lesson does not belong to the resolved module THEN the inline error state renders", async ({
    page,
  }) => {
    // PRIMARY_LESSON belongs to module A. Visit it under module B's slug.
    await page.goto(lessonUrl("en", MODULE_B.slug, PRIMARY_LESSON.id));

    await expect(
      page.getByRole("heading", { name: /couldn't find this lesson in the module/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to home/i })).toBeVisible();
  });
});

test.describe("Lesson Page — locale awareness", () => {
  test("WHEN the locale is es THEN the UI chrome is translated", async ({ page }) => {
    await page.goto(lessonUrl("es", MODULE_A.slug, PRIMARY_LESSON.id));

    // The Spanish translation of "Mark as complete" appears.
    await expect(page.getByRole("button", { name: /marcar como completada/i })).toBeVisible();
  });
});

/**
 * Regression guard for the change `outline-current-lesson-visibility`.
 *
 * The outline marks the current lesson, but on the 107-lesson course the
 * sidebar was taller than the viewport and scrolled with the page, so a
 * lesson from a late module opened with its mark far below the fold. This
 * must live at the e2e layer: it is a claim about real layout, and jsdom
 * has none — every rect there reads back as zero.
 */
test.describe("Lesson Page — the outline shows where the learner is", () => {
  const MID_LESSON_OF_LAST_MODULE =
    LAST_MODULE_LESSONS[Math.floor(LAST_MODULE_LESSONS.length / 2)]!;

  test("WHEN a lesson in the last module opens THEN the outline has scrolled it into view and the page has not moved", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(lessonUrl("en", LAST_MODULE.slug, MID_LESSON_OF_LAST_MODULE.id));

    // The desktop outline is the only one in the accessibility tree at this
    // width; the mobile drawer is display:none.
    const outline = page.getByRole("navigation", { name: /course outline/i });
    const currentLesson = outline.locator('[aria-current="page"]');

    await expect(currentLesson).toHaveText(
      new RegExp(escapeRegExp(MID_LESSON_OF_LAST_MODULE.title)),
    );
    await expect(currentLesson).toBeInViewport();

    // Positioning the outline must not have dragged the learner away from
    // the player they just opened.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
