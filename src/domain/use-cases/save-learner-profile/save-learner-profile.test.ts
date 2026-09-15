import { makeSaveLearnerProfile } from "@/domain/use-cases/save-learner-profile/save-learner-profile";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

describe("saveLearnerProfile", () => {
  describe("GIVEN a valid profile", () => {
    test("WHEN the use case runs THEN the parsed profile is stored and returned", async () => {
      // Arrange
      const profiles = makeStubLearnerProfileRepository();
      const useCase = makeSaveLearnerProfile({ profiles });
      const name = faker.person.fullName();

      // Act
      const result = await useCase({
        name: `  ${name} `,
        avatar: { kind: "illustration", id: "plum" },
      });

      // Assert
      const expected = { name, avatar: { kind: "illustration", id: "plum" } };
      expect(result._unsafeUnwrap()).toEqual(expected);
      expect(await profiles.get()).toEqual(expected);
    });
  });

  describe("GIVEN a profile with a blank name", () => {
    test("WHEN the use case runs THEN it fails with invalid-learner-profile and writes nothing", async () => {
      // Arrange
      const profiles = makeStubLearnerProfileRepository();
      const write = vi.spyOn(profiles, "set");
      const useCase = makeSaveLearnerProfile({ profiles });

      // Act
      const result = await useCase({ name: "  ", avatar: { kind: "initials" } });

      // Assert
      expect(result._unsafeUnwrapErr().kind).toBe("invalid-learner-profile");
      expect(write).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a repository that rejects the write", () => {
    test("WHEN the use case runs THEN it resolves with internal-error", async () => {
      // Arrange
      const useCase = makeSaveLearnerProfile({
        profiles: makeStubLearnerProfileRepository({ setRejects: true }),
      });

      // Act
      const result = await useCase({ name: "Ana", avatar: { kind: "initials" } });

      // Assert
      expect(result._unsafeUnwrapErr().kind).toBe("internal-error");
    });
  });
});
