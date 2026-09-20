import { describe, expect, test } from "vitest";

import { accountErrorKey } from "./account-error-key";

describe("accountErrorKey", () => {
  test.each([
    ["INVALID_EMAIL_OR_PASSWORD", "invalidCredentials"],
    ["EMAIL_NOT_VERIFIED", "emailNotVerified"],
    ["VERIFICATION_FAILED", "captchaFailed"],
    ["MISSING_RESPONSE", "captchaFailed"],
    ["INVALID_TOKEN", "invalidToken"],
    ["PASSWORD_TOO_SHORT", "passwordLength"],
    ["PASSWORD_TOO_LONG", "passwordLength"],
  ])("WHEN Better Auth answers %s THEN the %s message is shown", (code, key) => {
    expect(accountErrorKey({ code, status: 400 })).toBe(key);
  });

  test("WHEN the server answers 429 THEN the too-many-attempts message is shown", () => {
    expect(accountErrorKey({ status: 429 })).toBe("tooManyRequests");
  });

  test("WHEN the code is unknown or missing THEN the generic message is shown", () => {
    expect(accountErrorKey({ code: "SOMETHING_NEW", status: 500 })).toBe("generic");
    expect(accountErrorKey({ status: 500 })).toBe("generic");
  });
});
