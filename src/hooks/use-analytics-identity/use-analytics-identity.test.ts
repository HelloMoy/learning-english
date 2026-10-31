import { grantConsent } from "@/lib/product-analytics/product-analytics";
import { givenProductAnalytics } from "@/test-setup/product-analytics/product-analytics";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useAnalyticsIdentity } from "./use-analytics-identity";

/**
 * Guards the `product-analytics` capability's "A consenting learner is
 * identified by account ID and nothing else" and "Signing out and deleting an
 * account end the identity on the device".
 */

describe("useAnalyticsIdentity", () => {
  describe("GIVEN a signed-in learner", () => {
    test("WHEN they accepted THEN they are identified by account ID and nothing else", () => {
      const client = givenProductAnalytics("granted");
      const accountId = faker.string.uuid();

      renderHook(() => useAnalyticsIdentity(accountId));

      expect(client.identify).toHaveBeenCalledExactlyOnceWith(accountId);
    });

    test.each(["pending", "denied"] as const)(
      "WHEN their answer is %s THEN they are not identified",
      (answer) => {
        const client = givenProductAnalytics(answer);

        renderHook(() => useAnalyticsIdentity(faker.string.uuid()));

        expect(client.identify).not.toHaveBeenCalled();
      },
    );

    test("WHEN they accept while already signed in THEN they are identified at that moment", () => {
      const client = givenProductAnalytics("pending");
      const accountId = faker.string.uuid();
      renderHook(() => useAnalyticsIdentity(accountId));

      act(() => grantConsent());

      expect(client.identify).toHaveBeenCalledExactlyOnceWith(accountId);
    });
  });

  describe("GIVEN a learner who was identified", () => {
    test("WHEN they sign out THEN the identity ends, and they are not asked for consent again", () => {
      const client = givenProductAnalytics("granted");
      const { rerender } = renderHook(
        ({ accountId }: { accountId: string | null }) => useAnalyticsIdentity(accountId),
        { initialProps: { accountId: faker.string.uuid() as string | null } },
      );

      rerender({ accountId: null });

      expect(client.reset).toHaveBeenCalledOnce();
      expect(client.get_explicit_consent_status()).toBe("granted");
    });
  });

  describe("GIVEN a visitor who is not signed in", () => {
    test("WHEN nobody was identified on this device THEN their anonymous identity is left alone", () => {
      const client = givenProductAnalytics("granted");

      renderHook(() => useAnalyticsIdentity(null));

      expect(client.reset).not.toHaveBeenCalled();
      expect(client.identify).not.toHaveBeenCalled();
    });
  });
});
