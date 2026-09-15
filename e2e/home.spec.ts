import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test, type Page } from "@playwright/test";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";

/**
 * E2E coverage for the landing, the learner onboarding, My learning and the
 * Profile page (capabilities: `cinema-home`, `learner-onboarding`,
 * `learner-profile`, `my-learning`, `profile-page`, `continue-watching`,
 * `vowel-length-card`).
 *
 * These are the integrations only a browser can show: the profile's
 * `localStorage` round trip across real navigations, the client guards
 * redirecting, the header hearing a save made on another component, and the
 * card's recording being requested. Every section is covered in isolation by
 * Vitest + RTL.
 *
 * Everything is derived from the shipped catalog, so declaring a course moves
 * this suite with it.
 */
const COURSES = contentCatalog.courses;
const FIRST_COURSE = COURSES[0]!;

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const PROFILE_KEY = "learning-english:learner-profile";

const FIRST_MODULE = modulesOfCourse(FIRST_COURSE.slug)[0]!;
const FIRST_MODULE_LESSONS = lessonsOfModule(FIRST_MODULE.id);
const FIRST_LESSON = FIRST_MODULE_LESSONS[0]!;
const FIRST_LESSON_URL = `/en/courses/${FIRST_COURSE.slug}/modules/${FIRST_MODULE.slug}/lessons/${FIRST_LESSON.id}`;

/** Puts a learner card on the device before any page script runs. */
const withProfile = async (page: Page, name = "Ana García") => {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    PROFILE_KEY,
    JSON.stringify({ name, avatar: { kind: "initials" } }),
  ] as const);
};

test.describe("Landing", () => {
  test("WHEN a first-time visitor lands THEN Start course leads to the onboarding", async ({
    page,
  }) => {
    await page.goto("/en");

    const start = page.getByRole("link", { name: "Start course" }).first();
    await expect(start).toHaveAttribute("href", "/en/start", COLD_ROUTE);
    await expect(page.getByText("Welcome back")).toHaveCount(0);
  });

  test("WHEN a learner who opened a lesson returns THEN the landing is still the landing", async ({
    page,
  }) => {
    await withProfile(page);
    await page.goto(FIRST_LESSON_URL);
    await expect(page.getByRole("heading", { name: FIRST_LESSON.title })).toBeVisible(COLD_ROUTE);

    await page.goto("/en");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Learn American English one sound at a time.",
      }),
    ).toBeVisible(COLD_ROUTE);
    await expect(page.getByRole("link", { name: "Resume" })).toHaveCount(0);
  });

  test("WHEN the landing is visited THEN every catalog course gets a row, in sequence order", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(
      page.getByRole("heading", { name: `${COURSES.length} levels, in order` }),
    ).toBeVisible(COLD_ROUTE);
    const rows = page
      .getByRole("list", { name: "Available courses, in order" })
      .getByRole("listitem");
    await expect(rows).toHaveCount(COURSES.length);
    for (const [index, course] of COURSES.entries()) {
      await expect(rows.nth(index)).toContainText(course.title);
    }
  });

  test("WHEN the landing is visited in /es THEN the editorial copy is Spanish", async ({
    page,
  }) => {
    await page.goto("/es");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Aprende el inglés americano sonido por sonido.",
      }),
    ).toBeVisible(COLD_ROUTE);
    await expect(page.getByRole("link", { name: "Empezar el curso" }).first()).toBeVisible();
  });

  test("WHEN a word of the vowel-length card is pressed THEN its recording is fetched and served", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page.getByRole("button", { name: "Play ship" })).toBeVisible(COLD_ROUTE);

    const clip = page.waitForResponse((response) =>
      response.url().endsWith("/audio/minimal-pairs/ship.mp3"),
    );
    await page.getByRole("button", { name: "Play ship" }).click();

    expect((await clip).ok()).toBe(true);
  });
});

test.describe("Onboarding", () => {
  test("WHEN a visitor makes a learner card THEN they land on My learning, greeted by name", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Start course" }).first().click(COLD_ROUTE);
    await page.waitForURL(/\/en\/start$/, COLD_ROUTE);

    await page.getByRole("textbox", { name: "Your name" }).fill("Ana García");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/\/en\/start\/avatar$/, COLD_ROUTE);

    await page.getByRole("radio", { name: "Echo" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/\/en\/learning$/, COLD_ROUTE);

    await expect(page.getByRole("heading", { level: 1, name: "Welcome back, Ana." })).toBeVisible(
      COLD_ROUTE,
    );
    await expect(page.getByRole("button", { name: "Learner menu for Ana García" })).toBeVisible();
  });

  test("WHEN a learner with a card lands THEN the action reads Continue and skips the onboarding", async ({
    page,
  }) => {
    await withProfile(page);
    await page.goto("/en");

    await expect(page.getByRole("link", { name: "Continue" }).first()).toHaveAttribute(
      "href",
      "/en/learning",
      COLD_ROUTE,
    );
    // The closing band trades the first-lesson offer for the learner's own card.
    await expect(
      page.getByRole("heading", { level: 2, name: "Pick up where you left off, Ana." }),
    ).toBeVisible();
    await expect(page.getByText("Level 1 · Basic Course")).toBeVisible();
    await expect(page.getByText("to find out what your ear has been missing")).toHaveCount(0);
  });

  test("WHEN a device with a card opens the onboarding THEN it is forwarded to My learning", async ({
    page,
  }) => {
    await withProfile(page);
    await page.goto("/en/start");

    await page.waitForURL(/\/en\/learning$/, COLD_ROUTE);
  });

  test("WHEN a device without a card opens a learner page THEN it is sent to the onboarding", async ({
    page,
  }) => {
    for (const path of ["/en/start/avatar", "/en/learning", "/en/profile"]) {
      await page.goto(path);
      await page.waitForURL(/\/en\/start$/, COLD_ROUTE);
    }
  });
});

test.describe("My learning", () => {
  test("WHEN a lesson has been opened THEN My learning offers to resume it and marks its course", async ({
    page,
  }) => {
    await withProfile(page);
    await page.goto(FIRST_LESSON_URL);
    await expect(page.getByRole("heading", { name: FIRST_LESSON.title })).toBeVisible(COLD_ROUTE);

    await page.goto("/en/learning");

    await expect(
      page.getByText(
        `${FIRST_COURSE.title} · Lesson ${FIRST_MODULE.sequence} · ${FIRST_MODULE.title} · Video ${FIRST_LESSON.sequence} of ${FIRST_MODULE_LESSONS.length}`,
      ),
    ).toBeVisible(COLD_ROUTE);
    const rows = page
      .getByRole("list", { name: "Available courses, in order" })
      .getByRole("listitem");
    await expect(rows.nth(0)).toContainText("In progress");
    await expect(
      page.getByRole("list", { name: `Lessons in ${FIRST_COURSE.title}` }).getByRole("listitem"),
    ).toHaveCount(modulesOfCourse(FIRST_COURSE.slug).length);

    await page.getByRole("link", { name: "Resume" }).click();
    await page.waitForURL(new RegExp(`${FIRST_LESSON.id}$`), COLD_ROUTE);
  });
});

test.describe("Profile", () => {
  test("WHEN the learner saves a new avatar THEN the header shows it without a reload", async ({
    page,
  }) => {
    await withProfile(page);
    await page.goto("/en/learning");

    await page.getByRole("button", { name: "Learner menu for Ana García" }).click(COLD_ROUTE);
    await page.getByRole("menuitem", { name: "Profile" }).click();
    await page.waitForURL(/\/en\/profile$/, COLD_ROUTE);

    await page.getByRole("radio", { name: "Plum" }).click(COLD_ROUTE);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Card updated" })).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: "Learner menu for Ana García" })
        .locator('[data-illustration="plum"]'),
    ).toBeVisible();
  });
});
