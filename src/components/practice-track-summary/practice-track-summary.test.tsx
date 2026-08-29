import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PracticeTrackSummary } from "./practice-track-summary";

describe("PracticeTrackSummary", () => {
  test("renders one numeric mark per module and exposes an accessible label", () => {
    render(
      <PracticeTrackSummary
        moduleCount={3}
        label="Course modules"
      />,
    );
    expect(screen.getByLabelText("Course modules")).toBeInTheDocument();
    expect(screen.getAllByTestId("practice-track-mark")).toHaveLength(3);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  test("renders nothing when the module count is zero", () => {
    const { container } = render(
      <PracticeTrackSummary
        moduleCount={0}
        label="Course modules"
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
