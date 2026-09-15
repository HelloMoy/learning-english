import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { makeFindLearnerProfile } from "@/domain/use-cases/find-learner-profile/find-learner-profile";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

const buildProfile = () =>
  LearnerProfile.parse({ name: faker.person.fullName(), avatar: { kind: "initials" } });

describe("findLearnerProfile", () => {
  describe("GIVEN a saved profile", () => {
    test("WHEN the use case runs THEN it resolves with that profile", async () => {
      // Arrange
      const profile = buildProfile();
      const useCase = makeFindLearnerProfile({
        profiles: makeStubLearnerProfileRepository({ profile }),
      });

      // Act
      const result = await useCase();

      // Assert
      expect(result._unsafeUnwrap()).toEqual(profile);
    });
  });

  describe("GIVEN no saved profile", () => {
    test("WHEN the use case runs THEN it resolves with null", async () => {
      // Arrange
      const useCase = makeFindLearnerProfile({ profiles: makeStubLearnerProfileRepository() });

      // Act
      const result = await useCase();

      // Assert
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });

  describe("GIVEN a repository that rejects", () => {
    test("WHEN the use case runs THEN it resolves with internal-error", async () => {
      // Arrange
      const useCase = makeFindLearnerProfile({
        profiles: makeStubLearnerProfileRepository({ getRejects: true }),
      });

      // Act
      const result = await useCase();

      // Assert
      expect(result._unsafeUnwrapErr().kind).toBe("internal-error");
    });
  });
});
