import { describe, expect, test } from "vitest";

import { loadCatalogEntries } from "./catalog-levels";
import { loadCourseViews } from "./course-views";

describe("loadCourseViews", () => {
  test("WHEN loaded THEN every catalog course's view comes back, in catalog order", async () => {
    const catalog = await loadCatalogEntries();

    const views = await loadCourseViews();

    expect(views.map((view) => view.course.slug)).toEqual(
      catalog.map((entry) => entry.course.slug),
    );
  });

  test("WHEN loaded THEN each view carries one summary per module, with its lessons", async () => {
    const views = await loadCourseViews();

    for (const view of views) {
      expect(view.moduleSummaries).toHaveLength(view.modules.length);
      expect(view.moduleSummaries.some((summary) => summary.lessons.length > 0)).toBe(true);
    }
  });
});
