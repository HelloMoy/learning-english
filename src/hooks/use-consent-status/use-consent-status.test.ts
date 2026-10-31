import { denyConsent, grantConsent } from "@/lib/product-analytics/product-analytics";
import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useConsentStatus } from "./use-consent-status";

describe("useConsentStatus", () => {
  test("WHEN product analytics never started THEN the status is unavailable", () => {
    const { result } = renderHook(() => useConsentStatus());

    expect(result.current).toBe("unavailable");
  });

  test.each(["pending", "granted", "denied"] as const)(
    "WHEN the visitor's answer is %s THEN that is the status",
    (answer) => {
      givenProductAnalytics(answer);

      const { result } = renderHook(() => useConsentStatus());

      expect(result.current).toBe(answer);
    },
  );

  test("WHEN the visitor changes their answer THEN the status follows without a reload", () => {
    givenProductAnalytics("pending");
    const { result } = renderHook(() => useConsentStatus());

    act(() => grantConsent());
    const afterAccepting = result.current;
    act(() => denyConsent());

    expect(afterAccepting).toBe("granted");
    expect(result.current).toBe("denied");
  });
});
