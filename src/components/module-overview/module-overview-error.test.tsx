import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ModuleOverviewError } from "./module-overview-error";

describe("ModuleOverviewError", () => {
  test("WHEN the course is known THEN Back to course opens its progress board", () => {
    renderInLocale(<ModuleOverviewError courseSlug="basic-course" />);

    expect(screen.getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/courses/basic-course/progress",
    );
  });
});
