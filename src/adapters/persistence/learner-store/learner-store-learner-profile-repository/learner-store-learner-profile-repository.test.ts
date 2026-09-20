import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { describe, expect, test, vi } from "vitest";

import { LearnerStoreLearnerProfileRepository } from "./learner-store-learner-profile-repository";

const ana = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });
const plum = LearnerProfile.parse({ name: "Ana", avatar: { kind: "illustration", id: "plum" } });

describe("LearnerStoreLearnerProfileRepository", () => {
  test("WHEN the learner has a card THEN it is read from the store", async () => {
    givenLearner.profile(ana);

    expect(await new LearnerStoreLearnerProfileRepository({ save: vi.fn() }).get()).toEqual(ana);
  });

  test("WHEN a card is saved THEN the server is asked and the store holds it", async () => {
    const save = vi.fn(async () => true);

    await new LearnerStoreLearnerProfileRepository({ save }).set(plum);

    expect(save).toHaveBeenCalledWith(plum);
    expect(learnerStore.getState().profile).toEqual(plum);
  });

  test("WHEN the server refuses THEN the previous card comes back", async () => {
    givenLearner.profile(ana);

    await new LearnerStoreLearnerProfileRepository({ save: async () => false }).set(plum);

    expect(learnerStore.getState().profile).toEqual(ana);
  });
});
