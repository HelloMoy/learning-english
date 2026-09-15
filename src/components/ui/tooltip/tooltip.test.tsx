import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const ProgressTooltip = () => (
  <Tooltip>
    <TooltipTrigger>4 of 48 videos</TooltipTrigger>
    <TooltipContent>8% of the course watched</TooltipContent>
  </Tooltip>
);

describe("Tooltip", () => {
  describe("GIVEN a trigger nobody has reached", () => {
    test("WHEN rendered THEN no tooltip is in the document", () => {
      render(<ProgressTooltip />);

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a pointer user", () => {
    test("WHEN the trigger is hovered THEN the tooltip shows its content", async () => {
      const user = userEvent.setup();
      render(<ProgressTooltip />);

      await user.hover(screen.getByRole("button", { name: "4 of 48 videos" }));

      expect(await screen.findByRole("tooltip")).toHaveTextContent("8% of the course watched");
    });
  });

  describe("GIVEN a keyboard user", () => {
    test("WHEN the trigger receives focus THEN the tooltip shows, and Escape hides it", async () => {
      const user = userEvent.setup();
      render(<ProgressTooltip />);

      await user.tab();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("8% of the course watched");

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });
});
