import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-account-fixture";

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
const LEVEL_COURSES = COURSES.filter((course) => course.track === "level");
const REFERENCE_COURSES = COURSES.filter((course) => course.track === "reference");
const FIRST_COURSE = LEVEL_COURSES[0]!;

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const FIRST_MODULE = modulesOfCourse(FIRST_COURSE.slug)[0]!;
const FIRST_MODULE_LESSONS = lessonsOfModule(FIRST_MODULE.id);
const FIRST_LESSON = FIRST_MODULE_LESSONS[0]!;
const FIRST_LESSON_URL = `/en/courses/${FIRST_COURSE.slug}/modules/${FIRST_MODULE.slug}/lessons/${FIRST_LESSON.id}`;

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
    learnerState,
  }) => {
    await learnerState.profile({ name: "Ana García", avatar: { kind: "initials" } });
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

  test("WHEN the landing is visited THEN every level course gets a row, in sequence order", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(
      page.getByRole("heading", { name: `${LEVEL_COURSES.length} levels, in order` }),
    ).toBeVisible(COLD_ROUTE);
    const rows = page
      .getByRole("list", { name: "Available courses, in order" })
      .getByRole("listitem");
    await expect(rows).toHaveCount(LEVEL_COURSES.length);
    for (const [index, course] of LEVEL_COURSES.entries()) {
      await expect(rows.nth(index)).toContainText(course.title);
    }
  });

  test("WHEN the landing is visited THEN the reference courses sit in their own table AND open their overview", async ({
    page,
  }) => {
    await page.goto("/en");

    const rows = page.getByRole("list", { name: "Reference courses" }).getByRole("listitem");
    await expect(rows).toHaveCount(REFERENCE_COURSES.length, COLD_ROUTE);
    const atlas = rows.filter({ hasText: "Atlas of American Sounds" });
    await expect(atlas).toContainText("Reference");

    await atlas.getByRole("link", { name: "View course" }).click();

    await page.waitForURL(/\/en\/courses\/atlas-of-american-sounds$/, COLD_ROUTE);
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

const CARD = { name: "Ana García", avatar: { kind: "initials" } } as const;
const pad = (sequence: number) => String(sequence).padStart(2, "0");

test.describe("Onboarding", () => {
  test("WHEN a visitor makes a learner card THEN step 3 recommends the Basic Course AND starting it opens its first video", async ({
    page,
    learnerState,
  }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Start course" }).first().click(COLD_ROUTE);
    await page.waitForURL(/\/en\/start$/, COLD_ROUTE);

    // The name is typed in the card itself, and Enter there continues the step.
    const name = page.getByRole("textbox", { name: "Your name" });
    await expect(page.getByTestId("learner-card")).toContainText("Level 1", COLD_ROUTE);
    await name.fill("Ana García");
    await name.press("Enter");
    await page.waitForURL(/\/en\/start\/avatar$/, COLD_ROUTE);

    await page.getByRole("radio", { name: "Echo" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/\/en\/start\/first-course$/, COLD_ROUTE);

    await expect(
      page.getByRole("heading", { level: 1, name: "Your first course, Ana" }),
    ).toBeVisible(COLD_ROUTE);
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    await expect(page.getByText("Recommended for you")).toBeVisible();

    await page.getByRole("button", { name: `Start the ${FIRST_COURSE.title}` }).click();
    await page.waitForURL(new RegExp(`${FIRST_LESSON.id}$`), COLD_ROUTE);
    await expect
      .poll(() => learnerState.enrolledCourseSlugs(), COLD_ROUTE)
      .toEqual([FIRST_COURSE.slug]);

    await page.goto("/en/learning");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back, Ana." })).toBeVisible(
      COLD_ROUTE,
    );
  });

  test("WHEN the learner chooses See all courses on step 3 THEN Available courses opens AND nothing is enrolled", async ({
    page,
    learnerState,
  }) => {
    await learnerState.profile(CARD);
    await page.goto("/en/start/first-course");

    await page.getByRole("link", { name: "See all courses" }).click(COLD_ROUTE);

    await page.waitForURL(/\/en\/courses$/, COLD_ROUTE);
    await expect(page.getByRole("heading", { level: 1, name: "Available courses" })).toBeVisible(
      COLD_ROUTE,
    );
    expect(await learnerState.enrolledCourseSlugs()).toEqual([]);
  });

  test("WHEN a learner with a card but no course opens My learning THEN step 3 opens without the step indicator", async ({
    page,
    learnerState,
  }) => {
    await learnerState.profile(CARD);
    await page.goto("/en/learning");

    await page.waitForURL(/\/en\/start\/first-course\?from=learning$/, COLD_ROUTE);
    await expect(
      page.getByRole("heading", { level: 1, name: "Your first course, Ana" }),
    ).toBeVisible(COLD_ROUTE);
    await expect(page.getByText("Step 3 of 3")).toHaveCount(0);
  });

  test("WHEN a learner with a card lands THEN the action reads Continue and skips the onboarding", async ({
    page,
    learnerState,
  }) => {
    await learnerState.profile(CARD);
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

  test("WHEN a device with a card and a course opens the onboarding THEN it is forwarded to My learning", async ({
    page,
    learnerState,
  }) => {
    await learnerState.profile(CARD);
    await learnerState.enrolled([FIRST_COURSE.slug]);
    await page.goto("/en/start");

    await page.waitForURL(/\/en\/learning$/, COLD_ROUTE);
  });

  test("WHEN a device without a card opens a learner page THEN it is sent to the onboarding", async ({
    page,
  }) => {
    for (const path of [
      "/en/start/avatar",
      "/en/start/first-course",
      "/en/learning",
      "/en/profile",
    ]) {
      await page.goto(path);
      await page.waitForURL(/\/en\/start$/, COLD_ROUTE);
    }
  });
});

test.describe("My learning", () => {
  test("WHEN a lesson has been opened THEN My learning offers to resume it AND lists its course", async ({
    page,
    learnerState,
  }) => {
    await learnerState.profile(CARD);
    await page.goto(FIRST_LESSON_URL);
    await expect(page.getByRole("heading", { name: FIRST_LESSON.title })).toBeVisible(COLD_ROUTE);
    // The lesson page records the visit after it renders; leaving before that
    // write lands makes My learning read an older location.
    await expect.poll(() => learnerState.lastOpenedLessonId(), COLD_ROUTE).toBe(FIRST_LESSON.id);

    await page.goto("/en/learning");

    await expect(
      page.getByText(
        `${FIRST_COURSE.title} · Module ${pad(FIRST_MODULE.sequence)} · Video ${FIRST_LESSON.sequence} of ${FIRST_MODULE_LESSONS.length}`,
      ),
    ).toBeVisible(COLD_ROUTE);
    await expect(
      page.getByRole("heading", { level: 2, name: "1 course you’re enrolled in" }),
    ).toBeVisible();

    await page.getByTestId("resume-tile").getByRole("link").click();
    await page.waitForURL(new RegExp(`${FIRST_LESSON.id}$`), COLD_ROUTE);
  });

  test("WHEN the opened lesson is finished THEN My learning AND the course overview both continue with the next video", async ({
    page,
    learnerState,
  }) => {
    const nextLesson = modulesOfCourse(FIRST_COURSE.slug)
      .flatMap((module) => lessonsOfModule(module.id))
      .find((lesson) => lesson.id !== FIRST_LESSON.id)!;
    await learnerState.profile(CARD);
    await page.goto(FIRST_LESSON_URL);
    await expect(page.getByRole("heading", { name: FIRST_LESSON.title })).toBeVisible(COLD_ROUTE);
    // The lesson page records the visit after it renders; leaving before that
    // write lands makes My learning read an older location.
    await expect.poll(() => learnerState.lastOpenedLessonId(), COLD_ROUTE).toBe(FIRST_LESSON.id);
    await learnerState.completed([FIRST_LESSON.id]);

    await page.goto("/en/learning");
    await expect(page.getByTestId("resume-tile").getByRole("link")).toHaveAttribute(
      "href",
      new RegExp(`${nextLesson.id}$`),
      COLD_ROUTE,
    );

    await page.goto(`/en/courses/${FIRST_COURSE.slug}`);
    await expect(page.getByTestId("continue-tile").getByRole("link")).toHaveAttribute(
      "href",
      new RegExp(`${nextLesson.id}$`),
      COLD_ROUTE,
    );
  });

  test("WHEN the learner last watched the second course THEN My learning resumes it AND lists both with their own places", async ({
    page,
    learnerState,
  }) => {
    const second = COURSES[1]!;
    const secondModule = modulesOfCourse(second.slug)[0]!;
    const secondLesson = lessonsOfModule(secondModule.id)[0]!;
    const basicModule = modulesOfCourse(FIRST_COURSE.slug)[1]!;
    const basicLesson = lessonsOfModule(basicModule.id)[2]!;
    await learnerState.profile(CARD);
    await learnerState.enrolled([FIRST_COURSE.slug, second.slug]);
    await learnerState.continueWatching({
      courseSlug: FIRST_COURSE.slug,
      moduleSlug: basicModule.slug,
      lessonId: basicLesson.id,
    });
    await learnerState.continueWatching({
      courseSlug: second.slug,
      moduleSlug: secondModule.slug,
      lessonId: secondLesson.id,
    });

    await page.goto("/en/learning");

    const tile = page.getByTestId("resume-tile");
    await expect(tile.getByRole("heading", { level: 2, name: secondLesson.title })).toBeVisible(
      COLD_ROUTE,
    );
    const cards = page.getByTestId("enrolled-course-summary-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText(basicLesson.title);
    await expect(cards.nth(1)).toHaveAttribute("data-current", "true");
  });
});

test.describe("Profile", () => {
  test("WHEN the learner saves a new avatar THEN the header shows it without a reload", async ({
    page,
    learnerState,
  }) => {
    await learnerState.profile(CARD);
    await learnerState.enrolled([FIRST_COURSE.slug]);
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
