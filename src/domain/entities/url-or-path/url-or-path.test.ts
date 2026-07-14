import { describe, expect, test } from "vitest";

import { urlOrRelativePath } from "./url-or-path";

describe("urlOrRelativePath", () => {
  const validate = urlOrRelativePath();

  test.each([
    "https://example.com/handout.pdf",
    "http://localhost:3000/videos/x.mp4",
    "/handouts/vowel-chart.pdf",
    "/videos/vowels-short-vs-long.mp4",
    "/thumbnails/x.jpg",
  ])("accepts %s", (value) => {
    expect(validate.safeParse(value).success).toBe(true);
  });

  test.each([
    ["", "empty"],
    ["handouts/x.pdf", "no leading slash"],
    ["//cdn.example.com/x", "protocol-relative"],
    ["\\\\server\\share\\x", "windows path"],
    ["not-a-url", "bare string"],
    ["ftp://example.com/x", "non-http scheme"],
    ["javascript:alert(1)", "dangerous scheme"],
    ["/", "single slash"],
  ])("rejects %s (%s)", (value) => {
    expect(validate.safeParse(value).success).toBe(false);
  });
});
