import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { LearnerCard } from "./learner-card";

const level = { number: 1, courseTitle: "Basic Course" };
const noProgress = { completed: 0, total: 48 };

describe("LearnerCard", () => {
  describe("GIVEN a distinction", () => {
    test("WHEN the learner holds bronze THEN the card takes the bronze finish AND names it in the tag", () => {
      renderInLocale(
        <LearnerCard
          name="Ana García"
          avatar={{ kind: "initials" }}
          level={level}
          progress={noProgress}
          distinction="bronze"
        />,
      );

      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.queryByText("Learner")).not.toBeInTheDocument();
      expect(screen.getByTestId("learner-card")).toHaveAttribute("data-distinction", "bronze");
    });

    test("WHEN the learner holds gold in es THEN the tag reads Oro", () => {
      renderInLocale(
        <LearnerCard
          name="Ana García"
          avatar={{ kind: "initials" }}
          level={level}
          progress={noProgress}
          distinction="gold"
        />,
        "es",
      );

      expect(screen.getByText("Oro")).toBeInTheDocument();
    });

    test("WHEN the learner is a student THEN the tag keeps the Learner label", () => {
      renderInLocale(
        <LearnerCard
          name="Ana García"
          avatar={{ kind: "initials" }}
          level={level}
          progress={noProgress}
          distinction="student"
        />,
      );

      expect(screen.getByText("Learner")).toBeInTheDocument();
      expect(screen.getByTestId("learner-card")).toHaveAttribute("data-distinction", "student");
    });
  });

  test("WHEN no distinction is given THEN the card carries none", () => {
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={noProgress}
      />,
    );

    expect(screen.getByTestId("learner-card")).not.toHaveAttribute("data-distinction");
  });

  test("WHEN rendered THEN it carries the brand, the Learner tag, the level line and the progress label", () => {
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={noProgress}
      />,
    );

    expect(screen.getByText("Learner")).toBeInTheDocument();
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("Level 1 · Basic Course")).toBeInTheDocument();
    expect(screen.getByText("American English · pronunciation")).toBeInTheDocument();
    expect(screen.getByText("0 of 48 videos")).toBeInTheDocument();
  });

  test("WHEN the progress label is hovered THEN the tooltip shows the ring's percentage, the count and what is left", async () => {
    const user = userEvent.setup();
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={{ completed: 4, total: 48 }}
      />,
    );

    await user.hover(screen.getByRole("button", { name: "4 of 48 videos" }));

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("8%");
    expect(tooltip).toHaveTextContent("4 of 48 videos");
    expect(tooltip).toHaveTextContent("44 to go in Basic Course");
    // Radix renders a visually hidden copy for assistive technology; the ring is drawn once.
    const [fill] = screen.getAllByTestId("progress-ring-fill");
    const circumference = 2 * Math.PI * Number(fill!.getAttribute("r"));
    const [drawn] = fill!.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(drawn).toBeCloseTo((circumference * 4) / 48, 1);
  });

  test("WHEN the progress label is focused in es THEN the tooltip copy and percentage are Spanish", async () => {
    const user = userEvent.setup();
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={{ completed: 24, total: 48 }}
      />,
      "es",
    );

    await user.tab();

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(/50\s?%/);
    expect(tooltip).toHaveTextContent("Faltan 24 en Basic Course");
  });

  test("WHEN every video is complete THEN the tooltip reads 100% and says the course is complete", async () => {
    const user = userEvent.setup();
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={{ completed: 48, total: 48 }}
      />,
    );

    await user.hover(screen.getByRole("button", { name: "48 of 48 videos" }));

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("100%");
    expect(tooltip).toHaveTextContent("Basic Course complete");
    expect(tooltip).not.toHaveTextContent("to go");
  });

  test("WHEN the progress label is tapped on a touch screen THEN the tooltip opens, and a second tap closes it", async () => {
    // Radix tooltips open on hover and focus only; a phone has neither, so the
    // tap is what must open it.
    const user = userEvent.setup();
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={{ completed: 4, total: 48 }}
      />,
    );
    const label = screen.getByRole("button", { name: "4 of 48 videos" });

    await user.pointer({ keys: "[TouchA]", target: label });

    expect(await screen.findByRole("tooltip")).toHaveTextContent("44 to go in Basic Course");

    await user.pointer({ keys: "[TouchA]", target: label });

    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  test("WHEN the course has no videos THEN the tooltip reads zero percent rather than failing", async () => {
    const user = userEvent.setup();
    renderInLocale(
      <LearnerCard
        name="Ana García"
        avatar={{ kind: "initials" }}
        level={level}
        progress={{ completed: 0, total: 0 }}
      />,
    );

    await user.hover(screen.getByRole("button", { name: "0 of 0 videos" }));

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("0%");
    expect(tooltip).not.toHaveTextContent("complete");
  });

  describe("GIVEN a name field to carry", () => {
    test("WHEN the card is given one THEN it stands where the name goes", () => {
      renderInLocale(
        <LearnerCard
          name="Ana"
          avatar={{ kind: "initials" }}
          level={level}
          progress={noProgress}
          nameField={
            <input
              aria-label="Your name"
              defaultValue="Ana"
            />
          }
        />,
      );

      const card = screen.getByTestId("learner-card");
      expect(within(card).getByRole("textbox", { name: "Your name" })).toBeInTheDocument();
      // The field holds the name now; the card must not print it twice.
      expect(within(card).queryByText("Ana")).not.toBeInTheDocument();
      expect(within(card).queryByText("Your name")).not.toBeInTheDocument();
      // The rest of the card is untouched: the avatar still follows the name.
      expect(screen.getByRole("img", { name: "Avatar: Ana" })).toHaveTextContent("A");
    });

    test("WHEN the card is given none THEN it prints the name as it always has", () => {
      renderInLocale(
        <LearnerCard
          name="Ana García"
          avatar={{ kind: "initials" }}
          level={level}
          progress={noProgress}
        />,
      );

      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  test("WHEN the card sits inside a form THEN its progress label never submits it", async () => {
    // The onboarding puts the card in its form. A button with no type submits,
    // and this one comes first in the DOM — so Enter in the name field would
    // open a tooltip instead of continuing the step.
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    renderInLocale(
      <form onSubmit={onSubmit}>
        <LearnerCard
          name="Ana García"
          avatar={{ kind: "initials" }}
          level={level}
          progress={noProgress}
        />
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "0 of 48 videos" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("WHEN the name is empty THEN a placeholder stands in for it", () => {
    renderInLocale(
      <LearnerCard
        name="  "
        avatar={{ kind: "initials" }}
        level={level}
        progress={noProgress}
      />,
    );

    expect(screen.getByText("Your name")).toBeInTheDocument();
    // The placeholder is not a name: its initials must not stand in for the learner's.
    const avatar = screen.getByRole("img", { name: "Avatar" });
    expect(avatar).toHaveTextContent("?");
    expect(avatar).not.toHaveTextContent("YN");
  });

  test("WHEN the name changes THEN the card and its initials follow", () => {
    const { rerender } = renderInLocale(
      <LearnerCard
        name=""
        avatar={{ kind: "initials" }}
        level={level}
        progress={noProgress}
      />,
    );

    rerender(
      <LearnerCard
        name="Ana"
        avatar={{ kind: "initials" }}
        level={level}
        progress={noProgress}
      />,
    );

    expect(screen.queryByText("Your name")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avatar: Ana" })).toHaveTextContent("A");
  });
});
