import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { OnboardingProgress } from "./onboarding-progress";

const segmentStates = () =>
  screen.getAllByTestId("onboarding-segment").map((segment) => segment.dataset.state);

describe("OnboardingProgress", () => {
  test("WHEN on step one THEN it says so and fills one of three segments", () => {
    renderInLocale(<OnboardingProgress step={1} />);

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(segmentStates()).toEqual(["reached", "ahead", "ahead"]);
  });

  test("WHEN on step two THEN two of three segments are filled", () => {
    renderInLocale(<OnboardingProgress step={2} />);

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(segmentStates()).toEqual(["reached", "reached", "ahead"]);
  });

  test("WHEN on step three THEN every segment is filled", () => {
    renderInLocale(<OnboardingProgress step={3} />);

    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    expect(segmentStates()).toEqual(["reached", "reached", "reached"]);
  });

  test("WHEN rendered in es THEN the label comes from the Spanish catalogue", () => {
    renderInLocale(<OnboardingProgress step={1} />, "es");

    expect(screen.getByText("Paso 1 de 3")).toBeInTheDocument();
  });
});
