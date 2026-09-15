import { useRequireLearnerProfile } from "@/hooks/use-require-learner-profile/use-require-learner-profile";

import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { RequireLearnerProfile } from "./require-learner-profile";

vi.mock("@/hooks/use-require-learner-profile/use-require-learner-profile", () => ({
  useRequireLearnerProfile: vi.fn(),
}));

describe("RequireLearnerProfile", () => {
  test("WHEN a course route mounts the gate THEN the profile requirement runs and nothing renders", () => {
    const { container } = render(<RequireLearnerProfile />);

    expect(useRequireLearnerProfile).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
