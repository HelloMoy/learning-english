import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useRouter } from "@/i18n/navigation";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ProfileView } from "./profile-view";

const level = { number: 1, courseTitle: "Basic Course" };

const moduleId = ModuleId.parse(faker.string.uuid());
const lessonRuntimes = [0, 1].map((index) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: index + 1,
}));

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });

const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  window.localStorage.clear();
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

const account = {
  name: "Ana García",
  email: "ana@example.com",
  signInMethods: ["password"] as const,
};

const renderProfile = (
  profiles = makeStubLearnerProfileRepository({ profile }),
  identity: typeof account | null = account,
) =>
  renderInLocale(
    <ProfileView
      profiles={profiles}
      level={level}
      lessonRuntimes={lessonRuntimes}
      account={identity}
    />,
  );

describe("ProfileView", () => {
  test("WHEN storage has not answered THEN a shell stands in for the form", () => {
    renderProfile();

    expect(screen.getByTestId("profile-shell")).toBeInTheDocument();
  });

  test("WHEN the device has no profile THEN the learner is sent to the onboarding", async () => {
    renderProfile(makeStubLearnerProfileRepository());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
  });

  describe("GIVEN a learner with a card", () => {
    test("WHEN the page opens THEN the form holds the stored card and Save waits for a change", async () => {
      renderProfile();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Edit your learner card" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ana García");
      expect(screen.getByRole("radio", { name: "Initials" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
      expect(screen.getByText("0 of 2 videos")).toBeInTheDocument();
    });

    test("WHEN the page opens THEN it ends with the section that deletes the account", async () => {
      renderProfile();

      expect(
        await screen.findByRole("heading", { level: 2, name: "Delete account" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument();
    });

    test("WHEN the page opens THEN the account section stands between the card form and the deletion", async () => {
      renderProfile();

      const headings = (await screen.findAllByRole("heading", { level: 2 })).map(
        (heading) => heading.textContent,
      );
      expect(headings).toEqual(["Account", "Delete account"]);
      expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    });

    test("WHEN the account is not known THEN the page still edits the card and offers no settings", async () => {
      renderProfile(makeStubLearnerProfileRepository({ profile }), null);

      expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Ana García");
      expect(screen.queryByRole("heading", { level: 2, name: "Account" })).not.toBeInTheDocument();
    });

    test("WHEN videos are complete THEN the card counts them", async () => {
      givenLearner.completed([lessonRuntimes[0]!.id]);
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: null }));
      });

      renderProfile();

      expect(await screen.findByText("1 of 2 videos")).toBeInTheDocument();
    });

    test("WHEN the name is edited THEN the card previews it and nothing is stored", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository({ profile });
      renderProfile(profiles);

      const field = await screen.findByRole("textbox", { name: "Name" });
      await user.clear(field);
      await user.type(field, "Ana María López");

      expect(screen.getByText("Ana María López")).toBeInTheDocument();
      expect(await profiles.get()).toEqual(profile);
      expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    });

    test("WHEN the name is cleared THEN Save is unavailable", async () => {
      const user = userEvent.setup();
      renderProfile();

      await user.clear(await screen.findByRole("textbox", { name: "Name" }));

      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    test("WHEN a new avatar is saved THEN it is stored and a confirmation is announced", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository({ profile });
      renderProfile(profiles);

      await user.click(await screen.findByRole("radio", { name: "Plum" }));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(await screen.findByRole("status")).toHaveTextContent("Card updated");
      expect(await profiles.get()).toEqual({
        name: "Ana García",
        avatar: { kind: "illustration", id: "plum" },
      });
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    test("WHEN edits are discarded THEN the form and the card return to the stored card", async () => {
      const user = userEvent.setup();
      renderProfile();

      const field = await screen.findByRole("textbox", { name: "Name" });
      await user.clear(field);
      await user.type(field, "Someone Else");
      await user.click(screen.getByRole("button", { name: "Discard" }));

      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ana García");
      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.queryByText("Someone Else")).not.toBeInTheDocument();
    });
  });
});
