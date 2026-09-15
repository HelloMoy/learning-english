import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useRouter } from "@/i18n/navigation";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { OnboardingAvatarStep } from "./onboarding-avatar-step";

const level = { number: 1, courseTitle: "Basic Course" };

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });

const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  router.replace.mockClear();
  router.push.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

const renderStep = (profiles = makeStubLearnerProfileRepository({ profile })) =>
  renderInLocale(
    <OnboardingAvatarStep
      profiles={profiles}
      level={level}
      videoCount={48}
    />,
  );

describe("OnboardingAvatarStep", () => {
  test("WHEN storage has not answered THEN a shell stands in for the step", () => {
    renderStep();

    expect(screen.getByTestId("onboarding-shell")).toBeInTheDocument();
  });

  test("WHEN the device has no profile THEN the learner is sent back to step one", async () => {
    renderStep(makeStubLearnerProfileRepository());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
  });

  describe("GIVEN the name from step one", () => {
    test("WHEN the step opens THEN the card carries the saved name and the initials are checked", async () => {
      renderStep();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Now pick your avatar" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Initials" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    test("WHEN an illustration is picked THEN the card shows it before anything is saved", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository({ profile });
      renderStep(profiles);

      await user.click(await screen.findByRole("radio", { name: "Echo" }));

      const avatar = screen.getByRole("img", { name: "Avatar: Ana García" });
      expect(avatar.querySelector('[data-illustration="echo"]')).not.toBeNull();
      expect(await profiles.get()).toEqual(profile);
    });

    test("WHEN Continue is pressed THEN the chosen avatar is saved and My learning opens", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository({ profile });
      renderStep(profiles);

      await user.click(await screen.findByRole("radio", { name: "Echo" }));
      await user.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/learning"));
      expect(await profiles.get()).toEqual({
        name: "Ana García",
        avatar: { kind: "illustration", id: "echo" },
      });
    });
  });
});
