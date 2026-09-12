import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test } from "@playwright/test";

import { modulesOfCourse } from "./content-seed-fixtures";

/**
 * E2E tests for the Lesson Page (capability: `lesson-page`).
 *
 * Fixtures come from the **content seed**, which is the whole catalog.
 * `course-catalog.spec.ts` resolves its fixtures the same way.
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

const MODULES = modulesOfCourse(COURSE_SLUG);
const MODULE_A = MODULES[0]!;
const MODULE_B = MODULES[1]!;
const LAST_MODULE = MODULES[MODULES.length - 1]!;

const lessonsIn = (moduleId: string) =>
  bySequence(contentCatalog.lessonRows.filter((lesson) => lesson.moduleId === moduleId));

const MODULE_A_LESSONS = lessonsIn(MODULE_A.id);

/**
 * A lesson's notes `readme.md`, identified by content key rather than by
 * filename: `notesKeys` maps a lesson to the key its notes live under, and a
 * `ResourceRow.url` holds that same key. The Notes tab renders this file
 * inline, so the rail deliberately offers no link to it.
 */
const notesKeyOf = (lessonId: string): string | undefined => contentCatalog.notesKeys[lessonId];

/** The resources of one lesson that the "Resources" card actually lists. */
const railResourcesOf = (lessonId: string) =>
  contentCatalog.resourceRows.filter(
    (resource) => resource.lessonId === lessonId && resource.url !== notesKeyOf(lessonId),
  );

/**
 * The primary fixture is the first lesson in module A that carries a
 * resource of any kind, and is not the module's last lesson so "up next
 * stays inside the module" is exercisable. It drives the route, breadcrumb,
 * title, outline, and up-next assertions.
 *
 * Every resource in module A happens to be a notes `readme.md`, which the
 * rail excludes — so this lesson shows the Resources card's empty state, and
 * the fixtures that need a rendered resource row live below.
 */
const PRIMARY_LESSON = MODULE_A_LESSONS.find(
  (lesson, index) =>
    index < MODULE_A_LESSONS.length - 1 &&
    contentCatalog.resourceRows.some((resource) => resource.lessonId === lesson.id),
)!;
const LESSON_AFTER_PRIMARY = MODULE_A_LESSONS[MODULE_A_LESSONS.indexOf(PRIMARY_LESSON) + 1]!;

/**
 * A lesson the rail actually lists resources for, wherever in the course it
 * lives. Module A carries only notes files, so pinning the link assertions to
 * it would leave them asserting over an empty list.
 */
const LESSON_WITH_RAIL_RESOURCES = bySequence(contentCatalog.lessonRows)
  .filter((lesson) => MODULES.some((module_) => module_.id === lesson.moduleId))
  .find((lesson) => railResourcesOf(lesson.id).length > 0)!;
const MODULE_OF_RAIL_RESOURCES = MODULES.find(
  (module_) => module_.id === LESSON_WITH_RAIL_RESOURCES.moduleId,
)!;

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
    // The brand suffix comes from the layout's title template — see
    // lesson-view-polish § "The Lesson Page sets a per-page <title>".
    await expect(page).toHaveTitle(`${PRIMARY_LESSON.title} · English Course`);

    // Breadcrumb shows three segments.
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();

    // Outline (left aside) is present. It renders as a <nav> with an
    // accessible name of "Course outline".
    await expect(page.getByRole("navigation", { name: /course outline/i })).toBeVisible();

    // The Vidstack player renders as a labelled region with its own chrome;
    // the provider's `<video>` is an implementation detail behind it.
    await expect(page.getByRole("region", { name: /video player/i })).toBeVisible();

    // The Resources region renders. This lesson's only resource is its notes
    // `readme.md`, which the rail excludes because the Notes tab already
    // renders it — so the card shows its empty state rather than a row.
    const resources = page
      .getByRole("region", { name: /resources/i })
      .and(page.locator(":visible"));
    await expect(resources).toBeVisible();
    await expect(resources.getByRole("link")).toHaveCount(0);

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

  test("WHEN mark-as-complete is clicked THEN the control states the lesson is complete", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));

    await page.getByRole("button", { name: /mark as complete/i }).click();

    // The state is stated once, and the primary button gives way to the undo.
    await expect(page.getByText(/lesson completed/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /mark as complete/i })).toBeHidden();
    await expect(page.getByRole("button", { name: /^unmark$/i })).toBeEnabled();
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
  const NOTES_KEY_OF_PRIMARY_LESSON = notesKeyOf(PRIMARY_LESSON.id);
  const RAIL_RESOURCES = railResourcesOf(LESSON_WITH_RAIL_RESOURCES.id);

  for (const locale of ["en", "es"]) {
    test(`WHEN the ${locale} lesson page is visited THEN every resource link is unprefixed and fetches 200`, async ({
      page,
    }) => {
      await page.goto(
        lessonUrl(locale, MODULE_OF_RAIL_RESOURCES.slug, LESSON_WITH_RAIL_RESOURCES.id),
      );

      // The rail has one card — "Resources" — and it lists every resource
      // except the notes file.
      expect(RAIL_RESOURCES.length).toBeGreaterThan(0);

      // Scoped to the card: a resource titled "Day" would otherwise also
      // match the outline's fifteen "Day N" lesson links.
      const resourcesCard = page
        .getByRole("region", { name: /resources|materiales/i })
        .and(page.locator(":visible"));
      await expect(resourcesCard).toBeVisible();

      for (const resource of RAIL_RESOURCES) {
        const link = resourcesCard.getByRole("link", {
          name: new RegExp(escapeRegExp(resource.title)),
        });

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

  /**
   * The negative half of the rule, asserted on the URL rather than on the
   * old card's heading: a shrunken loop above would still pass if the notes
   * link came back under a different label.
   */
  test("WHEN a lesson with notes is visited THEN nothing on the page links to the raw readme.md", async ({
    page,
  }) => {
    expect(
      NOTES_KEY_OF_PRIMARY_LESSON,
      "fixture lesson must carry notes for this to assert anything",
    ).toBeDefined();

    await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));

    // The notes themselves are on the page — in the Notes tab, not the rail.
    await expect(page.getByTestId("lesson-notes-tabs")).toBeVisible();
    await expect(page.locator(`a[href="${contentUrl(NOTES_KEY_OF_PRIMARY_LESSON!)}"]`)).toHaveCount(
      0,
    );
  });
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
    await expect(page).toHaveTitle(/^Not found · English Course$/);
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

/**
 * Coverage for the `lesson-close-card` capability.
 *
 * Which of the two next-lesson affordances a learner can reach is decided by
 * a CSS breakpoint, so only a real browser can answer it: jsdom applies no
 * stylesheet and sees both.
 */
test.describe("Lesson Page — the lesson closes with the next one on a phone", () => {
  const nextLessonHref = `/lessons/${LESSON_AFTER_PRIMARY.id}`;

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("WHEN a lesson opens THEN the closing card offers the next lesson and the rail card is gone", async ({
      page,
    }) => {
      await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));

      // The closing card sits at the end of the center column, right after
      // the lesson's own content.
      const closingRow = page
        .getByTestId("lesson-close-card")
        .locator(`a[href*="${nextLessonHref}"]`);
      await expect(closingRow).toBeVisible();
      await expect(closingRow).toHaveAttribute(
        "href",
        new RegExp(`/modules/${MODULE_A.slug}/lessons/${LESSON_AFTER_PRIMARY.id}`),
      );
      await expect(closingRow).toHaveAccessibleName(
        new RegExp(escapeRegExp(LESSON_AFTER_PRIMARY.title)),
      );

      // It is the only one in the center column, and it is a tappable target.
      await expect(closingRow).toHaveCount(1);
      expect((await closingRow.boundingBox())!.height).toBeGreaterThanOrEqual(44);

      // The stacked rail no longer carries the "Up next" card.
      await expect(page.getByRole("region", { name: /up next/i })).toBeHidden();

      // The lesson's materials come before the block that ends the lesson,
      // and only one copy of that card is on screen.
      const materials = page
        .getByRole("region", { name: /resources|materiales/i })
        .and(page.locator(":visible"));
      await expect(materials).toHaveCount(1);
      const materialsBox = (await materials.boundingBox())!;
      const closingBox = (await page.getByTestId("lesson-close-card").boundingBox())!;
      expect(materialsBox.y + materialsBox.height).toBeLessThanOrEqual(closingBox.y);

      // The action it wraps still works.
      await page.getByRole("button", { name: /mark as complete/i }).click();
      await expect(page.getByText(/lesson completed/i)).toBeVisible();
    });
  });

  test("WHEN the same lesson opens on a desktop viewport THEN the rail card is the only next-lesson affordance", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));

    await expect(page.getByRole("region", { name: /up next/i })).toBeVisible();
    await expect(
      page.getByTestId("lesson-close-card").locator(`a[href*="${nextLessonHref}"]`),
    ).toBeHidden();

    // The rail's copy of the materials is the visible one at this width.
    const materials = page
      .getByRole("region", { name: /resources|materiales/i })
      .and(page.locator(":visible"));
    await expect(materials).toHaveCount(1);
    const materialsBox = (await materials.boundingBox())!;
    const closingBox = (await page.getByTestId("lesson-close-card").boundingBox())!;
    expect(materialsBox.x).toBeGreaterThan(closingBox.x + closingBox.width);
  });
});

/**
 * Coverage for the `lesson-completion-toggle` capability.
 *
 * The undo is a dialog away, and the dialog is a real browser affordance:
 * jsdom can prove the wiring, only a browser proves the learner can reach it.
 */
test.describe("Lesson Page — undoing a completion", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("WHEN a completed lesson is un-marked THEN it is asked first and then cleared", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", MODULE_A.slug, PRIMARY_LESSON.id));
    await page.getByRole("button", { name: /mark as complete/i }).click();
    await expect(page.getByText(/lesson completed/i)).toBeVisible();

    // The undo is quiet but tappable, and nothing about it is disabled.
    const unmark = page.getByRole("button", { name: /^unmark$/i });
    await expect(unmark).toBeEnabled();
    const unmarkBox = (await unmark.boundingBox())!;
    expect(unmarkBox.height).toBeGreaterThanOrEqual(44);

    // It sits beside the statement, not under it, and hugs the right edge.
    const statementBox = (await page.getByText(/lesson completed/i).boundingBox())!;
    const rowCentre = (box: { y: number; height: number }) => box.y + box.height / 2;
    expect(Math.abs(rowCentre(unmarkBox) - rowCentre(statementBox))).toBeLessThan(
      statementBox.height,
    );
    expect(unmarkBox.x).toBeGreaterThan(statementBox.x + statementBox.width);

    // Cancelling leaves the lesson complete.
    await unmark.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/progress/i);
    await dialog.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByText(/lesson completed/i)).toBeVisible();

    // Confirming returns the lesson to its incomplete state.
    await unmark.click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /unmark lesson/i })
      .click();
    await expect(page.getByRole("button", { name: /mark as complete/i })).toBeVisible();
    await expect(page.getByText(/lesson completed/i)).toBeHidden();
  });
});
