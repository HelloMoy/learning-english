import { LEARNER_PROFILE_STORAGE_KEY } from "@/adapters/persistence/browser-local-storage/browser-local-storage-learner-profile-repository/browser-local-storage-learner-profile-repository";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { learnerProfileServerSnapshot, useLearnerProfile } from "./use-learner-profile";

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

  describe("GIVEN another tab saves a profile", () => {
    test("WHEN the storage event arrives THEN the reader re-reads it", async () => {
      // Arrange
      const repository = makeStubLearnerProfileRepository();
      const { result } = renderHook(() => useLearnerProfile(repository));
      await waitFor(() => expect(result.current.status).toBe("absent"));
      const profile = buildProfile();
      await repository.set(profile);

      // Act
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: LEARNER_PROFILE_STORAGE_KEY }));
      });

      // Assert
      await waitFor(() => expect(result.current).toMatchObject({ status: "present", profile }));
    });
  });
});
