import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { PlayButton } from "./play-button";

describe("PlayButton", () => {
  test("is decorative (aria-hidden, not a control) by default", () => {
    const { container } = render(<PlayButton />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  test("renders a real button with an accessible name when interactive", async () => {
    const onClick = vi.fn();
    render(
      <PlayButton
        decorative={false}
        label="Play intro"
        onClick={onClick}
      />,
    );
    const button = screen.getByRole("button", { name: "Play intro" });
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
