import {
  denyConsent,
  grantConsent,
  reconsiderConsent,
} from "@/lib/product-analytics/product-analytics";
import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useConsentQuestion } from "./use-consent-question";

describe("useConsentQuestion", () => {
  test("WHEN product analytics never started THEN there is no question to ask", () => {
    const { result } = renderHook(() => useConsentQuestion());

    expect(result.current).toBe("unavailable");
  });

  test("WHEN the visitor has not answered THEN the question is open", () => {
    givenProductAnalytics("pending");

    const { result } = renderHook(() => useConsentQuestion());

    expect(result.current).toBe("open");
  });

  test.each(["granted", "denied"] as const)(
    "WHEN the visitor already answered %s THEN the question is answered",
    (answer) => {
      givenProductAnalytics(answer);

      const { result } = renderHook(() => useConsentQuestion());

      expect(result.current).toBe("answered");
    },
  );

  test("WHEN the visitor answers THEN the question closes without a reload", () => {
    givenProductAnalytics("pending");
    const { result } = renderHook(() => useConsentQuestion());

    act(() => grantConsent());

    expect(result.current).toBe("answered");
  });

  test("WHEN the visitor asks to reconsider THEN the question reopens until they answer again", () => {
    givenProductAnalytics("granted");
    const { result } = renderHook(() => useConsentQuestion());

    act(() => reconsiderConsent());
    const whileReconsidering = result.current;
    act(() => denyConsent());

    expect(whileReconsidering).toBe("open");
    expect(result.current).toBe("answered");
  });

  test("WHEN product analytics starts after the page rendered THEN the question opens", () => {
    const { result } = renderHook(() => useConsentQuestion());

    act(() => void givenProductAnalytics("pending"));

    expect(result.current).toBe("open");
  });
});
