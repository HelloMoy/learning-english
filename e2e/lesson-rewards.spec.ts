import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the reward moments on the Lesson Page (capability:
 * `learner-achievements`).
 *
 * Only a browser proves the moments follow a real completion: the toggle's
 * write reaches the completion store, the page observes the ticket, the
 * notification leaves on its own timer, and the module's last ticket hands the
 * learner over to the counter. It also proves a ticket outlives an un-mark,
 * which is a claim about storage that only a real un-mark can settle.
 */
const COURSE = contentCatalog.courses[0]!;
const [INTRODUCTION, VOWELS] = modulesOfCourse(COURSE.slug);
const INTRODUCTION_LESSON = lessonsOfModule(INTRODUCTION!.id)[0]!;
const VOWELS_LESSONS = lessonsOfModule(VOWELS!.id);

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const lessonPath = (moduleSlug: string, lessonId: string) =>
  `/es/courses/${COURSE.slug}/modules/${moduleSlug}/lessons/${lessonId}`;

test.describe("Reward moments on the Lesson Page", () => {
  test("WHEN the learner marks a lesson complete THEN a ticket notification appears AND leaves on its own", async ({
    page,
  }) => {
    await page.goto(lessonPath(VOWELS!.slug, VOWELS_LESSONS[0]!.id));

    await page.getByRole("button", { name: "Marcar como completada" }).click(COLD_ROUTE);

    const notification = page.getByRole("status").filter({
      hasText: `1 de ${VOWELS_LESSONS.length} tickets para el premio de ${VOWELS!.title}`,
    });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText("+1 ticket");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await expect(notification).toBeHidden({ timeout: 10_000 });
  });

  test("WHEN the learner collects a module's last ticket THEN the ticket plays first AND then sends them to claim the prize", async ({
    page,
  }) => {
    await page.goto(lessonPath(INTRODUCTION!.slug, INTRODUCTION_LESSON.id));

    await page.getByRole("button", { name: "Marcar como completada" }).click(COLD_ROUTE);

    // The ticket comes first, and nothing interrupts it.
    const notification = page.getByRole("status").filter({ hasText: "1 de 1 ticket" });
    await expect(notification).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Once it has left, the page hands the learner over — without naming the prize.
    const waiting = page.getByRole("dialog", { name: "Tienes un premio esperando" });
    await expect(waiting).toBeVisible({ timeout: 10_000 });
    await expect(waiting).not.toContainText("Silbato");

    await waiting.getByRole("link", { name: "Ir a reclamar premio" }).click();

    await expect(page).toHaveURL(/\/es\/achievements\?claim=/, COLD_ROUTE);
    await expect(
      page.getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` }),
    ).toBeVisible(COLD_ROUTE);

    // Among the shelves, the counter points at the one they came for.
    const called = page.locator(`[data-prize-slug="${INTRODUCTION!.slug}"][data-called="true"]`);
    await expect(called).toBeVisible();
    await expect(called).toBeFocused();
  });

  test("WHEN the last ticket is earned in fullscreen THEN the ticket shows there AND the dialog waits for the learner to come out", async ({
    page,
    learnerState,
  }) => {
    await page.goto(lessonPath(INTRODUCTION!.slug, INTRODUCTION_LESSON.id));
    await page.getByRole("button", { name: "Marcar como completada" }).waitFor(COLD_ROUTE);

    await page.getByRole("button", { name: "Pantalla completa" }).click({ force: true });
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

    // A ticket earned while the video fills the screen — here through the
    // completion control, which the fullscreen player covers but the page
    // still holds (the finish rule itself is covered by watch-progress.spec).
    await page.getByRole("button", { name: "Marcar como completada" }).dispatchEvent("click");
    await expect
      .poll(() => learnerState.isCompleted(INTRODUCTION_LESSON.id), COLD_ROUTE)
      .toBe(true);

    // The browser paints only what it presents, so the notification has to be inside it.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const presented = document.fullscreenElement;
          const status = document.querySelector('[role="status"]');
          return Boolean(presented && status && presented.contains(status));
        }),
      )
      .toBe(true);

    // The dialog does not interrupt the lesson, and never listens for an Escape
    // the learner meant for the video.
    await page.waitForTimeout(7000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

    // The player keeps Escape for itself, so leaving is the control's job.
    await page.getByRole("button", { name: "Pantalla completa" }).click({ force: true });
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);

    await expect(page.getByRole("dialog", { name: "Tienes un premio esperando" })).toBeVisible();
  });

  test("WHEN the learner un-marks a lesson THEN the ticket it earned stays on the counter", async ({
    page,
    learnerState,
  }) => {
    const hiddenPrize = `Premio oculto de ${VOWELS!.title}: 1 de ${VOWELS_LESSONS.length} tickets`;
    await page.goto(lessonPath(VOWELS!.slug, VOWELS_LESSONS[0]!.id));
    await page.getByRole("button", { name: "Marcar como completada" }).click(COLD_ROUTE);
    // A full page load cancels a save still in flight; wait for it to land.
    await expect.poll(() => learnerState.isCompleted(VOWELS_LESSONS[0]!.id), COLD_ROUTE).toBe(true);

    await page.goto("/es/achievements");
    await expect(page.getByText(hiddenPrize, { exact: true })).toBeAttached(COLD_ROUTE);

    // Back to the lesson, to undo the completion just recorded.
    await page.goto(lessonPath(VOWELS!.slug, VOWELS_LESSONS[0]!.id));
    await page.getByRole("button", { name: "Desmarcar" }).click(COLD_ROUTE);
    await page.getByRole("dialog").getByRole("button", { name: "Desmarcar lección" }).click();

    await page.goto("/es/achievements");

    // The lesson counts as pending again, but the ticket was already earned.
    await expect(page.getByText(hiddenPrize, { exact: true })).toBeAttached(COLD_ROUTE);
  });

  test("WHEN the learner moves on before the notification leaves THEN the prize is announced on the page they open", async ({
    page,
    learnerState,
  }) => {
    await page.goto(lessonPath(INTRODUCTION!.slug, INTRODUCTION_LESSON.id));

    await page.getByRole("button", { name: "Marcar como completada" }).click(COLD_ROUTE);
    // The in-app ways on keep a save in flight; the full page load below would
    // cancel it, so it waits for the save first.
    await expect
      .poll(() => learnerState.isCompleted(INTRODUCTION_LESSON.id), COLD_ROUTE)
      .toBe(true);

    // The notification is still on screen, so the dialog is still seconds away:
    // leaving now is what used to lose the announcement altogether.
    await expect(page.getByRole("status").filter({ hasText: "1 de 1 ticket" })).toBeVisible();
    await page.goto(lessonPath(VOWELS!.slug, VOWELS_LESSONS[0]!.id));

    await expect(page.getByRole("dialog", { name: "Tienes un premio esperando" })).toBeVisible(
      COLD_ROUTE,
    );
  });

  test("WHEN a prize is waiting THEN the avatar carries the count until the learner claims it", async ({
    page,
    learnerState,
  }) => {
    await page.goto(lessonPath(INTRODUCTION!.slug, INTRODUCTION_LESSON.id));

    await page.getByRole("button", { name: "Marcar como completada" }).click(COLD_ROUTE);
    // A full page load cancels a save still in flight; wait for it to land.
    await expect
      .poll(() => learnerState.isCompleted(INTRODUCTION_LESSON.id), COLD_ROUTE)
      .toBe(true);

    // The mark follows them off the lesson page: it is how an unclaimed prize
    // stays findable without interrupting anything.
    await expect(page.getByTestId("prize-mark")).toHaveText("1");
    await page.goto("/es/achievements");
    await expect(page.getByTestId("prize-mark")).toHaveText("1", COLD_ROUTE);

    await page
      .getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` })
      .click(COLD_ROUTE);

    await expect(page.getByTestId("prize-mark")).toHaveCount(0);
  });
});
