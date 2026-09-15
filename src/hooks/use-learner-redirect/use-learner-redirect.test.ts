import { useRouter } from "@/i18n/navigation";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useLearnerRedirect } from "./use-learner-redirect";

const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

describe("useLearnerRedirect", () => {
  test("WHEN the profile status matches the rule THEN the page is replaced with the target", () => {
    renderHook(() => useLearnerRedirect("absent", { when: "absent", to: "/start" }));

    expect(router.replace).toHaveBeenCalledWith("/start");
  });

  test("WHEN the profile status does not match THEN the page stays", () => {
    renderHook(() => useLearnerRedirect("present", { when: "absent", to: "/start" }));

    expect(router.replace).not.toHaveBeenCalled();
  });

  test("WHEN storage has not answered THEN nothing is decided", () => {
    renderHook(() => useLearnerRedirect("unknown", { when: "absent", to: "/start" }));

    expect(router.replace).not.toHaveBeenCalled();
  });

  test("WHEN the status changes to match THEN the page is replaced", () => {
    const { rerender } = renderHook(
      ({ status }: { status: "unknown" | "present" }) =>
        useLearnerRedirect(status, { when: "present", to: "/learning" }),
      { initialProps: { status: "unknown" as "unknown" | "present" } },
    );

    rerender({ status: "present" });

    expect(router.replace).toHaveBeenCalledWith("/learning");
  });
});
