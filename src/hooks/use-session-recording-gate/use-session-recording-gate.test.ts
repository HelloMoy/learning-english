import { usePathname } from "@/i18n/navigation";
import { denyConsent, grantConsent } from "@/lib/product-analytics/product-analytics";
import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useSessionRecordingGate } from "./use-session-recording-gate";

/**
 * Guards the `product-analytics` capability's "Sessions are recorded only
 * with consent, and never on credential pages".
 */

const LESSON = "/courses/c/modules/m/lessons/l";

// `@/i18n/navigation` is mocked globally; its `usePathname` answers "/" unless
// a test says otherwise. Like the real one, it returns the path without the
// locale prefix.
const pathname = vi.mocked(usePathname);

function openedOn(path: string) {
  pathname.mockReturnValue(path);
  return renderHook(() => useSessionRecordingGate());
}

function navigateTo(path: string, { rerender }: { rerender: () => void }) {
  pathname.mockReturnValue(path);
  rerender();
}

describe("useSessionRecordingGate", () => {
  afterEach(() => pathname.mockReturnValue("/"));

  test("WHEN the visitor accepted and the page is an ordinary one THEN recording starts", () => {
    const client = givenProductAnalytics("granted");

    openedOn(LESSON);

    expect(client.startSessionRecording).toHaveBeenCalledOnce();
  });

  test.each(["pending", "denied"] as const)(
    "WHEN the visitor's answer is %s THEN nothing is recorded",
    (answer) => {
      const client = givenProductAnalytics(answer);

      openedOn(LESSON);

      expect(client.startSessionRecording).not.toHaveBeenCalled();
    },
  );

  test("WHEN a visit begins on the reset-password link THEN that page is not recorded", () => {
    const client = givenProductAnalytics("granted");

    openedOn("/reset-password");

    expect(client.startSessionRecording).not.toHaveBeenCalled();
    expect(client.stopSessionRecording).toHaveBeenCalled();
  });

  test("WHEN a recorded visitor opens sign-in THEN recording stops", () => {
    const client = givenProductAnalytics("granted");
    const page = openedOn(LESSON);

    navigateTo("/sign-in", page);

    expect(client.stopSessionRecording).toHaveBeenCalledOnce();
  });

  test("WHEN a learner leaves sign-in for a learning page THEN recording resumes", () => {
    const client = givenProductAnalytics("granted");
    const page = openedOn("/sign-in");

    navigateTo("/learning", page);

    expect(client.startSessionRecording).toHaveBeenCalledOnce();
  });

  test("WHEN the visitor accepts on an ordinary page THEN recording starts at that moment", () => {
    const client = givenProductAnalytics("pending");
    openedOn(LESSON);

    act(() => grantConsent());

    expect(client.startSessionRecording).toHaveBeenCalledOnce();
  });

  test("WHEN a recorded visitor withdraws consent THEN recording stops at that moment", () => {
    const client = givenProductAnalytics("granted");
    openedOn(LESSON);

    act(() => denyConsent());

    expect(client.stopSessionRecording).toHaveBeenCalledOnce();
  });
});
