import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { usePathname, useRouter } from "@/i18n/navigation";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useRequireLearnerProfile } from "./use-require-learner-profile";

const router = { replace: vi.fn(), push: vi.fn() };
const lessonPath = "/courses/basics/modules/vowels/lessons/intro";

beforeEach(() => {
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
  vi.mocked(usePathname).mockReturnValue(lessonPath);
});

describe("useRequireLearnerProfile", () => {
  test("WHEN the device has no profile THEN the course route is replaced by the onboarding carrying it", async () => {
    const profiles = makeStubLearnerProfileRepository();

    renderHook(() => useRequireLearnerProfile(profiles));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(`/start?next=${encodeURIComponent(lessonPath)}`),
    );
  });

  test("WHEN the device has a profile THEN the course route stays", async () => {
    const profile = LearnerProfile.parse({ name: "Ana", avatar: { kind: "initials" } });
    const profiles = makeStubLearnerProfileRepository({ profile });
    const readProfile = vi.spyOn(profiles, "get");

    renderHook(() => useRequireLearnerProfile(profiles));

    await waitFor(() => expect(readProfile).toHaveBeenCalled());
    expect(router.replace).not.toHaveBeenCalled();
  });

  test("WHEN storage has not answered THEN nothing is decided", () => {
    renderHook(() => useRequireLearnerProfile(makeStubLearnerProfileRepository()));

    expect(router.replace).not.toHaveBeenCalled();
  });
});
