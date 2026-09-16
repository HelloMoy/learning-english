import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LessonTicket } from "./lesson-ticket";

describe("LessonTicket", () => {
  test("WHEN drawn THEN it shows the lesson's sound on a decorative ticket", () => {
    const { container } = render(<LessonTicket symbol="ɪ" />);

    const ticket = container.firstElementChild;
    expect(ticket).toHaveTextContent("ɪ");
    expect(ticket).toHaveAttribute("aria-hidden", "true");
    expect(ticket).toHaveAttribute("data-ticket-size", "md");
  });

  test("WHEN drawn small THEN it takes the small size", () => {
    const { container } = render(
      <LessonTicket
        symbol="aɪ"
        size="sm"
      />,
    );

    expect(container.firstElementChild).toHaveAttribute("data-ticket-size", "sm");
  });
});
