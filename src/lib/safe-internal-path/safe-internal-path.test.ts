import { describe, expect, test } from "vitest";

import { isSafeInternalPath } from "./safe-internal-path";

describe("isSafeInternalPath", () => {
  test("WHEN the value is a plain absolute path THEN it is safe", () => {
    expect(isSafeInternalPath("/courses/c/modules/m")).toBe(true);
  });

  test.each([
    ["relative", "courses/c"],
    ["a scheme", "https://evil.example"],
    ["a colon anywhere in the path", "/javascript:alert(1)"],
    ["protocol-relative", "//evil.example"],
    ["a doubled slash", "/courses//c"],
    ["a backslash", "/\\evil.example"],
    ["a parent segment", "/courses/../x"],
    ["a trailing parent segment", "/courses/.."],
  ])("WHEN the value is %s THEN it is unsafe", (_, value) => {
    expect(isSafeInternalPath(value)).toBe(false);
  });
});
