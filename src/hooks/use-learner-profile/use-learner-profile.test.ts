import { saveLearnerProfileAction } from "@/app/[locale]/learner-actions";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import { seedLearnerStore } from "@/lib/learner-store/learner-store";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { learnerProfileServerSnapshot, useLearnerProfile } from "./use-learner-profile";

vi.mock("@/app/[locale]/learner-actions", () => ({
  saveLearnerProfileAction: vi.fn(async () => ({ data: { saved: true } })),
}));

const buildProfile = () =>
  LearnerProfile.parse({ name: faker.person.fullName(), avatar: { kind: "initials" } });

describe("useLearnerProfile", () => {
  test("the server snapshot is unknown, so nothing is asserted before storage is read", () => {
    expect(learnerProfileServerSnapshot()).toEqual({ status: "unknown" });
  });

  describe("GIVEN the first render", () => {
    test("WHEN storage has not answered THEN the status is unknown", () => {
      // Arrange
      const repository = makeStubLearnerProfileRepository({ profile: buildProfile() });

      // Act
      const { result } = renderHook(() => useLearnerProfile(repository));

      // Assert
      expect(result.current.status).toBe("unknown");
    });
  });

  describe("GIVEN a device without a profile", () => {
    test("WHEN storage answers THEN the status is absent", async () => {
      // Arrange
      const repository = makeStubLearnerProfileRepository();

      // Act
      const { result } = renderHook(() => useLearnerProfile(repository));

      // Assert
      await waitFor(() => expect(result.current.status).toBe("absent"));
    });
  });

  describe("GIVEN a device with a profile", () => {
    test("WHEN storage answers THEN the status is present with that profile", async () => {
      // Arrange
      const profile = buildProfile();
      const repository = makeStubLearnerProfileRepository({ profile });

      // Act
      const { result } = renderHook(() => useLearnerProfile(repository));

      // Assert
      await waitFor(() => expect(result.current).toMatchObject({ status: "present", profile }));
    });
  });

  describe("GIVEN two mounted readers", () => {
    test("WHEN one saves a valid profile THEN both report it", async () => {
      // Arrange
      const repository = makeStubLearnerProfileRepository();
      const writer = renderHook(() => useLearnerProfile(repository));
      const reader = renderHook(() => useLearnerProfile(repository));
      await waitFor(() => expect(reader.result.current.status).toBe("absent"));
      const profile = buildProfile();

      // Act
      let saved = false;
      await act(async () => {
        saved = await writer.result.current.save(profile);
      });

      // Assert
      expect(saved).toBe(true);
      expect(reader.result.current).toMatchObject({ status: "present", profile });
    });

    test("WHEN a save is invalid THEN it reports failure and nothing changes", async () => {
      // Arrange
      const repository = makeStubLearnerProfileRepository();
      const { result } = renderHook(() => useLearnerProfile(repository));
      await waitFor(() => expect(result.current.status).toBe("absent"));

      // Act
      let saved = true;
      await act(async () => {
        saved = await result.current.save({ name: " ", avatar: { kind: "initials" } });
      });

      // Assert
      expect(saved).toBe(false);
      expect(result.current.status).toBe("absent");
    });
  });

  describe("GIVEN the signed-in learner's own store (no repository injected)", () => {
    test("WHEN the store has not been seeded THEN the status is unknown", () => {
      const { result } = renderHook(() => useLearnerProfile());

      expect(result.current.status).toBe("unknown");
    });

    test("WHEN the learner's snapshot arrives without a card THEN the status is absent", () => {
      const { result } = renderHook(() => useLearnerProfile());

      act(() => seedLearnerStore(EMPTY_LEARNER_SNAPSHOT));

      expect(result.current.status).toBe("absent");
    });

    test("WHEN the learner's snapshot carries a card THEN the status is present with it", () => {
      const profile = buildProfile();
      const { result } = renderHook(() => useLearnerProfile());

      act(() => seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, profile }));

      expect(result.current).toMatchObject({ status: "present", profile });
    });

    test("WHEN one reader saves THEN the card is saved for the learner and every reader shows it", async () => {
      seedLearnerStore(EMPTY_LEARNER_SNAPSHOT);
      const writer = renderHook(() => useLearnerProfile());
      const reader = renderHook(() => useLearnerProfile());
      const profile = buildProfile();

      let saved = false;
      await act(async () => {
        saved = await writer.result.current.save(profile);
      });

      expect(saved).toBe(true);
      expect(saveLearnerProfileAction).toHaveBeenCalledWith(profile);
      expect(reader.result.current).toMatchObject({ status: "present", profile });
    });

    test("WHEN the server refuses the card THEN save reports failure and the old state returns", async () => {
      vi.mocked(saveLearnerProfileAction).mockResolvedValueOnce({ serverError: "x" } as never);
      seedLearnerStore(EMPTY_LEARNER_SNAPSHOT);
      const { result } = renderHook(() => useLearnerProfile());

      let saved = true;
      await act(async () => {
        saved = await result.current.save(buildProfile());
      });

      expect(saved).toBe(false);
      expect(result.current.status).toBe("absent");
    });
  });
});
