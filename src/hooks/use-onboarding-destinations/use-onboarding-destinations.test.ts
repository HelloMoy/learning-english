import { renderHook } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, test } from "vitest";

import { useOnboardingDestinations } from "./use-onboarding-destinations";

const renderWithSearch = (searchParams: string) =>
  renderHook(() => useOnboardingDestinations(), {
    wrapper: withNuqsTestingAdapter({ searchParams }),
  });

describe("useOnboardingDestinations", () => {
  test("WHEN next is a course route THEN every destination carries it and onboarding ends there", () => {
    const next = "/courses/basics/modules/vowels";

    const { result } = renderWithSearch(`?next=${encodeURIComponent(next)}`);

    expect(result.current).toEqual({
      nameStep: `/start?next=${encodeURIComponent(next)}`,
      avatarStep: `/start/avatar?next=${encodeURIComponent(next)}`,
      afterOnboarding: next,
    });
  });

  test("WHEN next is unsafe THEN it is ignored and onboarding ends at My learning", () => {
    const { result } = renderWithSearch(`?next=${encodeURIComponent("https://evil.example")}`);

    expect(result.current).toEqual({
      nameStep: "/start",
      avatarStep: "/start/avatar",
      afterOnboarding: "/learning",
    });
  });

  test("WHEN there is no next THEN onboarding ends at My learning", () => {
    const { result } = renderWithSearch("");

    expect(result.current.afterOnboarding).toBe("/learning");
  });
});
