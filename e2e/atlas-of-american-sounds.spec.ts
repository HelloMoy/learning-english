import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { courseBySlug, lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * Smoke coverage for the Atlas of American Sounds (capability:
 * `atlas-of-american-sounds`): one single-sound lesson played end to end in a
 * real browser — its YouTube embed, its locally stored poster, and its notes in
 * the learner's language.
 *
 * Fixtures come from the tracked manifest, so retitling or reordering the
 * Atlas keeps the suite honest rather than asserting stale copy.
 */
const COURSE_SLUG = "atlas-of-american-sounds";
const COURSE = courseBySlug(COURSE_SLUG);
const FRONT_VOWELS = modulesOfCourse(COURSE_SLUG)[1]!;
const FIRST_SOUND = lessonsOfModule(FRONT_VOWELS.id)[0]!;

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const lessonUrl = (locale: string): string =>
  `/${locale}/courses/${COURSE_SLUG}/modules/${FRONT_VOWELS.slug}/lessons/${FIRST_SOUND.id}`;

test.describe("An Atlas of American Sounds lesson", () => {
  test("WHEN the Atlas is read from the catalog THEN it is reference material", () => {
    expect(contentCatalog.courses.find((course) => course.id === COURSE.id)?.track).toBe(
      "reference",
    );
  });

  test("WHEN its first sound lesson opens THEN the player embeds its own YouTube video", async ({
    page,
  }) => {
    if (FIRST_SOUND.kind !== "video") throw new Error("the first Atlas lesson must be a video");
    await page.goto(lessonUrl("en"));

    await expect(page.getByRole("heading", { level: 1, name: FIRST_SOUND.title })).toBeVisible(
      COLD_ROUTE,
    );
    const videoId = FIRST_SOUND.source.split("/").at(-1)!;
    await expect(page.locator(`iframe[src*="${videoId}"]`)).toHaveCount(1);
  });

  test("WHEN its poster is requested THEN it is served from the tracked content tree", async ({
    page,
  }) => {
    if (FIRST_SOUND.kind !== "video" || !FIRST_SOUND.poster) {
      throw new Error("every Atlas lesson declares a poster");
    }

    const response = await page.request.get(`/local-filesystem-lesson/${FIRST_SOUND.poster}`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/jpeg");
  });

  test("WHEN the lesson opens in es THEN its notes read in Spanish AND credit the channel", async ({
    page,
  }) => {
    await page.goto(lessonUrl("es"));

    const notes = page.getByTestId("lesson-notes-tabs");
    await expect(notes).toContainText("Video del canal de YouTube Sounds American.", COLD_ROUTE);
    await expect(notes).not.toContainText("Video by the Sounds American YouTube channel.");
  });
});
