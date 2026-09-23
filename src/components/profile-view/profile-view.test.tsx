import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import { useRouter } from "@/i18n/navigation";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { spokenRegions } from "@/test-setup/spoken-regions/spoken-regions";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ProfileView } from "./profile-view";

const level = { number: 1, courseTitle: "Basic Course" };

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
  sequence: 1,
});

const vowels = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 1,
});

const lessonRuntimes = [0, 1].map((index) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId: vowels.id,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: index + 1,
}));

const levels: AchievementLevel[] = [{ course, modules: [vowels], lessonRuntimes }];

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
  locale?: "en" | "es" | "pt",
) =>
  renderInLocale(
    <ProfileView
      profiles={profiles}
      level={level}
      lessonRuntimes={lessonRuntimes}
      levels={levels}
      account={identity}
    />,
    locale,
  );

/** The card prints its own tally, and the band's panel prints it again. */
const card = () => within(screen.getByTestId("learner-card"));

const sectionHeadings = async () =>
  (await screen.findAllByRole("heading", { level: 2 })).map((heading) => heading.textContent);

const saveButton = () => screen.queryByRole("button", { name: "Save changes" });

describe("ProfileView", () => {
  test("WHEN storage has not answered THEN a shell stands in for the page", () => {
    renderProfile();

    expect(screen.getByTestId("profile-shell")).toBeInTheDocument();
  });

  test("WHEN the device has no profile THEN the learner is sent to the onboarding", async () => {
    renderProfile(makeStubLearnerProfileRepository());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
  });

  describe("GIVEN a learner with a card", () => {
    test("WHEN the page opens THEN it is titled with the learner and reads as an outline", async () => {
      renderProfile();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Ana García" }),
      ).toBeInTheDocument();
      expect(await sectionHeadings()).toEqual([
        "Identity",
        "Account",
        "Preferences",
        "Delete account",
      ]);
    });

    test("WHEN the page opens THEN the identity section holds the stored card", async () => {
      renderProfile();

      expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Ana García");
      expect(screen.getByRole("radio", { name: "Initials" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(card().getByText("0 of 2 videos")).toBeInTheDocument();
    });

    test("WHEN nothing has been edited THEN there is no save bar", async () => {
      renderProfile();

      await screen.findByRole("textbox", { name: "Name" });

      expect(saveButton()).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Discard" })).not.toBeInTheDocument();
    });

    test("WHEN the page opens THEN the preferences section offers the language and the theme", async () => {
      renderProfile();

      const preferences = await screen.findByRole("region", { name: "Preferences" });
      expect(within(preferences).getByText("Interface language")).toBeInTheDocument();
      expect(within(preferences).getByText("Theme")).toBeInTheDocument();
    });

    test("WHEN the page opens THEN it ends with the section that deletes the account", async () => {
      renderProfile();

      const deletion = await screen.findByRole("region", { name: "Delete account" });
      expect(within(deletion).getByRole("button", { name: "Delete account" })).toBeInTheDocument();
    });

    test("WHEN the account is known THEN its section names the address", async () => {
      renderProfile();

      const settings = await screen.findByRole("region", { name: "Account" });
      expect(within(settings).getByText("ana@example.com")).toBeInTheDocument();
    });

    test("WHEN the account is not known THEN the page still edits the card and offers no settings", async () => {
      renderProfile(makeStubLearnerProfileRepository({ profile }), null);

      expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Ana García");
      expect(await sectionHeadings()).toEqual(["Identity", "Preferences", "Delete account"]);
    });

    test("WHEN videos are complete THEN the card counts them", async () => {
      givenLearner.completed([lessonRuntimes[0]!.id]);
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: null }));
      });

      renderProfile();

      await waitFor(() => expect(card().getByText("1 of 2 videos")).toBeInTheDocument());
    });

    test("WHEN the name is edited THEN the card previews it, the bar rises and nothing is stored", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository({ profile });
      renderProfile(profiles);

      const field = await screen.findByRole("textbox", { name: "Name" });
      await user.clear(field);
      await user.type(field, "Ana María López");

      expect(card().getByText("Ana María López")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Ana García" })).toBeInTheDocument();
      expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
      expect(saveButton()).toBeEnabled();
      expect(await profiles.get()).toEqual(profile);
    });

    test("WHEN the name is cleared THEN the bar stays but Save is unavailable", async () => {
      const user = userEvent.setup();
      renderProfile();

      await user.clear(await screen.findByRole("textbox", { name: "Name" }));

      expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    test("WHEN a new avatar is saved THEN it is stored and the bar carries the confirmation", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository({ profile });
      renderProfile(profiles);

      await user.click(await screen.findByRole("radio", { name: "Plum" }));
      await user.click(saveButton()!);

      // The delete section below keeps an empty live region mounted for its
      // wait, so this asserts the confirmation rather than the first region
      await waitFor(() => expect(spokenRegions()).toContain("Card updated"));
      expect(await profiles.get()).toEqual({
        name: "Ana García",
        avatar: { kind: "illustration", id: "plum" },
      });
      expect(saveButton()).not.toBeInTheDocument();
    });

    test("WHEN the page renders in Portuguese THEN every section heading comes from pt.json", async () => {
      renderProfile(makeStubLearnerProfileRepository({ profile }), account, "pt");

      expect(await screen.findByText("Perfil")).toBeInTheDocument();
      expect(screen.getByText("Seu cartão, sua conta e suas preferências.")).toBeInTheDocument();
      expect(await sectionHeadings()).toEqual([
        "Identidade",
        "Conta",
        "Preferências",
        "Excluir conta",
      ]);
    });

    test("WHEN edits are discarded THEN the card, the form and the bar return to the stored card", async () => {
      const user = userEvent.setup();
      renderProfile();

      const field = await screen.findByRole("textbox", { name: "Name" });
      await user.clear(field);
      await user.type(field, "Someone Else");
      await user.click(screen.getByRole("button", { name: "Discard" }));

      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ana García");
      expect(card().getByText("Ana García")).toBeInTheDocument();
      expect(screen.queryByText("Someone Else")).not.toBeInTheDocument();
      expect(saveButton()).not.toBeInTheDocument();
    });
  });
});
