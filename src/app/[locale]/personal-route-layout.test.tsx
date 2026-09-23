import { requireLearnerSession } from "@/lib/auth/require-learner-session/require-learner-session";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import AchievementsLayout from "./achievements/layout";
import CoursesLayout from "./courses/layout";
import LearningLayout from "./learning/layout";
import PersonalRouteLayout from "./personal-route-layout";
import ProfileLayout from "./profile/layout";
import StartLayout from "./start/layout";

vi.mock("@/lib/auth/require-learner-session/require-learner-session", () => ({
  requireLearnerSession: vi.fn(),
}));
vi.mock("./courses/require-learner-profile", () => ({ RequireLearnerProfile: () => null }));

/**
 * Guards the server half of "Personal routes require a session": every
 * personal route segment validates the session before rendering its page.
 */
beforeEach(() => {
  vi.mocked(requireLearnerSession).mockReset();
});

describe("PersonalRouteLayout", () => {
  test("checks the session in the route's locale before rendering the page", async () => {
    const params = Promise.resolve({ locale: "es" });

    render(await PersonalRouteLayout({ children: <p>page</p>, params }));

    expect(requireLearnerSession).toHaveBeenCalledWith("es");
    expect(screen.getByText("page")).toBeInTheDocument();
  });

  test.each([
    ["learning", LearningLayout],
    ["achievements", AchievementsLayout],
    ["profile", ProfileLayout],
    ["start", StartLayout],
  ])("guards the %s segment", (_, layout) => {
    expect(layout).toBe(PersonalRouteLayout);
  });

  test("guards the course routes too", async () => {
    render(
      await CoursesLayout({ children: <p>course</p>, params: Promise.resolve({ locale: "pt" }) }),
    );

    expect(requireLearnerSession).toHaveBeenCalledWith("pt");
    expect(screen.getByText("course")).toBeInTheDocument();
  });
});
