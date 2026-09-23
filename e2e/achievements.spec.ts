import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, ONBOARDED_LEARNER, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the learner's Achievements page (capability:
 * `learner-achievements`).
 *
 * Only a browser shows the whole path: the avatar menu's link, a completion
 * stored by an earlier visit read after hydration, and the prize that
 * completion readies — claimed, revealed, and still claimed on the next visit.
 */
const COURSE = contentCatalog.courses[0]!;
const [INTRODUCTION, VOWELS] = modulesOfCourse(COURSE.slug);
const INTRODUCTION_LESSON = lessonsOfModule(INTRODUCTION!.id)[0]!;
const VOWELS_LESSON_COUNT = lessonsOfModule(VOWELS!.id).length;

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

test.describe("The Achievements page", () => {
  test("WHEN the learner opens Achievements from the avatar menu THEN the page opens", async ({
    page,
  }) => {
    await page.goto("/es/learning");

    await page
      .getByRole("button", { name: `Menú de estudiante de ${ONBOARDED_LEARNER.name}` })
      .click(COLD_ROUTE);
    await page.getByRole("menuitem", { name: "Logros" }).click();

    await expect(page).toHaveURL(/\/es\/achievements$/, COLD_ROUTE);
    await expect(page.getByRole("heading", { level: 1, name: "Tus logros" })).toBeVisible(
      COLD_ROUTE,
    );
  });

  test("WHEN a module holds every ticket THEN its ticket is counted AND its prize waits to be claimed", async ({
    page,
    learnerState,
  }) => {
    await learnerState.completed([INTRODUCTION_LESSON.id]);

    await page.goto("/es/achievements");

    // The visible digits climb; the hidden sentences hold the final counts.
    await expect(page.getByTestId("achievements-ticket-count").locator(".sr-only")).toHaveText(
      /^1 de \d+ tickets$/,
      COLD_ROUTE,
    );
    await expect(page.getByTestId("achievements-prize-count").locator(".sr-only")).toHaveText(
      /^0 de \d+ premios$/,
    );

    const waiting = page.locator('[data-prize-state="ready"]');
    await expect(waiting).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` }),
    ).toBeVisible();
  });

  test("WHEN the learner claims that prize THEN it is revealed AND stays claimed on the next visit", async ({
    page,
    learnerState,
  }) => {
    await learnerState.completed([INTRODUCTION_LESSON.id]);
    await page.goto("/es/achievements");

    await page
      .getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` })
      .click(COLD_ROUTE);

    const reveal = page.getByRole("dialog", { name: "Silbato" });
    await expect(reveal).toBeVisible();
    await reveal.getByRole("button", { name: "¡Genial!" }).click();
    await expect(reveal).toBeHidden();

    await expect(page.getByTestId("achievements-prize-count").locator(".sr-only")).toHaveText(
      /^1 de \d+ premios$/,
    );

    await page.reload();

    await expect(page.getByText("Silbato: premio canjeado")).toBeAttached(COLD_ROUTE);
    await expect(
      page.getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` }),
    ).toHaveCount(0);
  });

  test("WHEN nothing has been started THEN the page closes with the way into the course", async ({
    page,
  }) => {
    // Only a browser proves the offered path is a real route: the href is built
    // from the catalog on the server and followed by the router.
    await page.goto("/es/achievements");

    const wayBack = page.getByRole("link", { name: "Empezar el curso" });
    await expect(wayBack).toBeVisible(COLD_ROUTE);
    await wayBack.click();

    await expect(page).toHaveURL(/\/es\/courses\/.+\/modules\/.+\/lessons\/.+/, COLD_ROUTE);
  });

  test("WHEN the learner continues the course from the reveal THEN a lesson opens", async ({
    page,
    learnerState,
  }) => {
    await learnerState.completed([INTRODUCTION_LESSON.id]);
    await page.goto("/es/achievements");

    await page
      .getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` })
      .click(COLD_ROUTE);
    const reveal = page.getByRole("dialog", { name: "Silbato" });
    await expect(reveal).toBeVisible();

    // The payout no longer strands them on the counter.
    await reveal.getByRole("link", { name: "Seguir con el curso" }).click();

    await expect(page).toHaveURL(/\/es\/courses\/.+\/modules\/.+\/lessons\/.+/, COLD_ROUTE);
  });

  test("WHEN a module has no ticket yet THEN its prize stays hidden and says so", async ({
    page,
  }) => {
    await page.goto("/es/achievements");

    await expect(
      page.getByText(`Premio oculto de ${VOWELS!.title}: 0 de ${VOWELS_LESSON_COUNT} tickets`, {
        exact: true,
      }),
    ).toBeAttached(COLD_ROUTE);
  });

  test("WHEN How do they work? is activated THEN the explanation opens and Escape closes it", async ({
    page,
  }) => {
    await page.goto("/es/achievements");

    const howItWorks = page.getByRole("button", { name: "¿Cómo funcionan?" });
    await howItWorks.click(COLD_ROUTE);

    const dialog = page.getByRole("dialog", { name: "¿Cómo funcionan los tickets y los premios?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      "Junta todos los tickets de un módulo para reclamar su premio",
    );

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(howItWorks).toBeFocused();
  });
});
