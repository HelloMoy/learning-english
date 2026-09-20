import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import { learnerStore, seedLearnerStore } from "@/lib/learner-store/learner-store";

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LearnerStateSeed } from "./learner-state-seed";

const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });

describe("LearnerStateSeed", () => {
  test("WHEN rendered with a snapshot THEN the browser store adopts it", () => {
    render(<LearnerStateSeed snapshot={{ ...EMPTY_LEARNER_SNAPSHOT, profile }} />);

    expect(learnerStore.getState().profile).toEqual(profile);
    expect(learnerStore.getState().isSeeded).toBe(true);
  });

  test("WHEN rendered without a snapshot, for a signed-out visitor, THEN the store holds a known, empty learner", () => {
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, profile });

    render(<LearnerStateSeed snapshot={null} />);

    // Known-empty, not unknown: a visitor has no card, and the pages that
    // offer one must be able to say so rather than wait forever.
    expect(learnerStore.getState().profile).toBeNull();
    expect(learnerStore.getState().isSeeded).toBe(true);
  });

  test("WHEN a new snapshot arrives, as after a sign-in refresh, THEN the store adopts it", () => {
    const { rerender } = render(<LearnerStateSeed snapshot={null} />);

    rerender(<LearnerStateSeed snapshot={{ ...EMPTY_LEARNER_SNAPSHOT, profile }} />);

    expect(learnerStore.getState().profile).toEqual(profile);
  });

  test("WHEN rendered THEN it adds nothing to the page", () => {
    const { container } = render(<LearnerStateSeed snapshot={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
