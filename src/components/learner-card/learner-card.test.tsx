import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { LearnerCard } from "./learner-card";

const level = { number: 1, courseTitle: "Basic Course" };
const noProgress = { completed: 0, total: 48 };

describe("LearnerCard", () => {
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
