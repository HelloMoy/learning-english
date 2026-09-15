import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StartCourseLink } from "./start-course-link";

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });

describe("StartCourseLink", () => {
  test("WHEN the profile is not known yet THEN it opens the onboarding, as the server rendered it", () => {
    renderInLocale(<StartCourseLink profiles={makeStubLearnerProfileRepository({ profile })} />);

    expect(screen.getByRole("link", { name: "Start course" })).toHaveAttribute("href", "/start");
  });

  test("WHEN the device has no profile THEN it opens the onboarding", async () => {
    renderInLocale(<StartCourseLink profiles={makeStubLearnerProfileRepository()} />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Start course" })).toHaveAttribute("href", "/start"),
    );
  });

  test("WHEN the device has a profile THEN it invites the learner to continue on My learning", async () => {
    renderInLocale(<StartCourseLink profiles={makeStubLearnerProfileRepository({ profile })} />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/learning"),
    );
    expect(screen.queryByRole("link", { name: "Start course" })).not.toBeInTheDocument();
  });

  test("WHEN the device has a profile in es THEN the label comes from the Spanish catalogue", async () => {
    renderInLocale(
      <StartCourseLink profiles={makeStubLearnerProfileRepository({ profile })} />,
      "es",
    );

    expect(await screen.findByRole("link", { name: "Continuar" })).toHaveAttribute(
      "href",
      "/learning",
    );
  });

  test("WHEN rendered in pt THEN the label comes from the Portuguese catalogue", () => {
    renderInLocale(<StartCourseLink profiles={makeStubLearnerProfileRepository()} />, "pt");

    expect(screen.getByRole("link", { name: "Começar o curso" })).toBeInTheDocument();
  });
});
