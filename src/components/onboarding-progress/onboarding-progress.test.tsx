import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { OnboardingProgress } from "./onboarding-progress";

describe("OnboardingProgress", () => {
  test("WHEN on step one THEN it says so and fills one of two segments", () => {
    renderInLocale(<OnboardingProgress step={1} />);

    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    const segments = screen.getAllByTestId("onboarding-segment");
    expect(segments.map((segment) => segment.dataset.state)).toEqual(["reached", "ahead"]);
  });

  test("WHEN on step two THEN both segments are filled", () => {
    renderInLocale(<OnboardingProgress step={2} />);

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    const segments = screen.getAllByTestId("onboarding-segment");
    expect(segments.map((segment) => segment.dataset.state)).toEqual(["reached", "reached"]);
  });

  test("WHEN rendered in es THEN the label comes from the Spanish catalogue", () => {
    renderInLocale(<OnboardingProgress step={1} />, "es");

    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
  });
});
