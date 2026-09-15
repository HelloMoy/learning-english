import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useRouter } from "@/i18n/navigation";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { OnboardingNameStep } from "./onboarding-name-step";

const level = { number: 1, courseTitle: "Basic Course" };

const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  router.replace.mockClear();
  router.push.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

const renderStep = (profiles = makeStubLearnerProfileRepository(), locale?: "en" | "es" | "pt") =>
  renderInLocale(
    <OnboardingNameStep
      profiles={profiles}
      level={level}
      videoCount={48}
    />,
    locale,
  );

describe("OnboardingNameStep", () => {
  test("WHEN storage has not answered THEN a shell stands in for the step", () => {
    renderStep();

    expect(screen.getByTestId("onboarding-shell")).toBeInTheDocument();
  });

  test("WHEN the device already has a profile THEN the learner is sent to My learning", async () => {
    const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });

    renderStep(makeStubLearnerProfileRepository({ profile }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/learning"));
  });

  describe("GIVEN a device without a profile", () => {
    test("WHEN the step opens THEN it shows step one, an empty card and an unavailable Continue", async () => {
      renderStep();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Let’s make your learner card" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
      expect(screen.getByText("Your name")).toBeInTheDocument();
      expect(screen.getByText("0 of 48 videos")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    test("WHEN the learner types a name THEN the card shows it and its initials", async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(await screen.findByRole("textbox", { name: "Your name" }), "Ana García");

      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Avatar: Ana García" })).toHaveTextContent("AG");
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    });

    test("WHEN the name is only spaces THEN Continue stays unavailable", async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(await screen.findByRole("textbox", { name: "Your name" }), "   ");

      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    test("WHEN Continue is pressed THEN the name is saved with initials and step two opens", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository();
      renderStep(profiles);

      await user.type(await screen.findByRole("textbox", { name: "Your name" }), " Ana García ");
      await user.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/start/avatar"));
      expect(await profiles.get()).toEqual({ name: "Ana García", avatar: { kind: "initials" } });
      // Saving creates the profile, which must not trip the "already onboarded" redirect.
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  test("WHEN rendered in pt THEN the step copy comes from the Portuguese catalogue", async () => {
    renderStep(makeStubLearnerProfileRepository(), "pt");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Vamos criar seu cartão de aluno" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Seu nome" })).toHaveAttribute(
      "placeholder",
      "Seu nome e sobrenome",
    );
  });
});
