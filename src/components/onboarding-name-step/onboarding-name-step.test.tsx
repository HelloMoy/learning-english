import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useRouter } from "@/i18n/navigation";
import { renderInLocale, type TestLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { OnboardingNameStep } from "./onboarding-name-step";

const level = { number: 1, courseTitle: "Basic Course" };

const courseReturnPath = "/courses/basics/modules/vowels";
const nextQuery = `?next=${encodeURIComponent(courseReturnPath)}`;

const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  router.replace.mockClear();
  router.push.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

const renderStep = ({
  profiles = makeStubLearnerProfileRepository(),
  locale,
  searchParams = "",
  accountName = "",
}: {
  profiles?: ReturnType<typeof makeStubLearnerProfileRepository>;
  locale?: TestLocale;
  searchParams?: string;
  accountName?: string;
} = {}) =>
  renderInLocale(
    <NuqsTestingAdapter searchParams={searchParams}>
      <OnboardingNameStep
        profiles={profiles}
        level={level}
        videoCount={48}
        accountName={accountName}
      />
    </NuqsTestingAdapter>,
    locale,
  );

describe("OnboardingNameStep", () => {
  test("WHEN storage has not answered THEN a shell stands in for the step", () => {
    renderStep();

    expect(screen.getByTestId("onboarding-shell")).toBeInTheDocument();
  });

  test("WHEN the device already has a profile THEN the learner is sent to My learning", async () => {
    const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });

    renderStep({ profiles: makeStubLearnerProfileRepository({ profile }) });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/learning"));
  });

  test("WHEN the device already has a profile and a course route is waiting THEN the learner is sent to it", async () => {
    const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });

    renderStep({
      profiles: makeStubLearnerProfileRepository({ profile }),
      searchParams: nextQuery,
    });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(courseReturnPath));
  });

  describe("GIVEN a device without a profile", () => {
    test("WHEN the step opens THEN it shows step one, an empty card and an unavailable Continue", async () => {
      renderStep();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Let’s make your learner card" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Your name" })).toHaveValue("");
      expect(screen.getByText("0 of 48 videos")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    test("WHEN the step opens THEN the name is typed in the card, and nowhere else", async () => {
      // Two places asking for one name is what sent learners clicking at the
      // card's placeholder while the field that answered sat below it.
      renderStep();

      const card = await screen.findByTestId("learner-card");
      expect(within(card).getByRole("textbox", { name: "Your name" })).toBeInTheDocument();
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
    });

    test("WHEN the card's field is read THEN it keeps what the step has always offered", async () => {
      renderStep();

      const field = await screen.findByRole("textbox", { name: "Your name" });
      // Short enough to fit where the name goes, at the name's size.
      expect(field).toHaveAttribute("placeholder", "Your name");
      expect(field).toHaveAttribute("autocomplete", "name");
      expect(field).toHaveAttribute("maxlength");
    });

    test("WHEN the field reads as a field THEN it carries its own line and focus ring", async () => {
      // In-place editing fails the other way round when nothing looks editable.
      const field = await (renderStep(), screen.findByRole("textbox", { name: "Your name" }));

      expect(field.className).toContain("border-b");
      expect(field.className).toContain("focus-visible:");
    });

    // Enter continuing the step is covered in `e2e/home.spec.ts`: jsdom does not
    // perform a form's implicit submission, so here it would test the test.

    test("WHEN the account carries a name THEN the card opens holding it, ready to continue", async () => {
      // The learner typed it on sign-up minutes ago; asking again wastes the answer.
      renderStep({ accountName: "Ana García" });

      expect(await screen.findByRole("textbox", { name: "Your name" })).toHaveValue("Ana García");
      expect(screen.getByRole("img", { name: "Avatar: Ana García" })).toHaveTextContent("AG");
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    });

    test("WHEN the account carries only spaces for a name THEN the field opens empty", async () => {
      renderStep({ accountName: "   " });

      expect(await screen.findByRole("textbox", { name: "Your name" })).toHaveValue("");
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    test("WHEN the learner rewrites the account's name THEN what the field holds is what is saved", async () => {
      const user = userEvent.setup();
      const profiles = makeStubLearnerProfileRepository();
      renderStep({ profiles, accountName: "Ana García" });

      await user.clear(await screen.findByRole("textbox", { name: "Your name" }));
      await user.type(screen.getByRole("textbox", { name: "Your name" }), "Ana");
      await user.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/start/avatar"));
      expect(await profiles.get()).toEqual({ name: "Ana", avatar: { kind: "initials" } });
    });

    test("WHEN the learner types a name THEN the card carries it and its initials", async () => {
      const user = userEvent.setup();
      renderStep();

      const field = await screen.findByRole("textbox", { name: "Your name" });
      await user.type(field, "Ana García");

      // The name lives in the field now, so the card holds it once, not twice.
      expect(field).toHaveValue("Ana García");
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
      renderStep({ profiles });

      await user.type(await screen.findByRole("textbox", { name: "Your name" }), " Ana García ");
      await user.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/start/avatar"));
      expect(await profiles.get()).toEqual({ name: "Ana García", avatar: { kind: "initials" } });
      // Saving creates the profile, which must not trip the "already onboarded" redirect.
      expect(router.replace).not.toHaveBeenCalled();
    });

    test("WHEN Continue is pressed with a course route waiting THEN step two opens carrying it", async () => {
      const user = userEvent.setup();
      renderStep({ searchParams: nextQuery });

      await user.type(await screen.findByRole("textbox", { name: "Your name" }), "Ana");
      await user.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith(`/start/avatar${nextQuery}`));
    });
  });

  test("WHEN rendered in pt THEN the step copy comes from the Portuguese catalogue", async () => {
    renderStep({ locale: "pt" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Vamos criar seu cartão de aluno" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Seu nome" })).toHaveAttribute(
      "placeholder",
      "Seu nome",
    );
  });
});
