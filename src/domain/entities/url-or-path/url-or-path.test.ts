import { describe, expect, test } from "vitest";

import { isAbsoluteHttpUrl, urlOrRelativePath } from "./url-or-path";

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

describe("isAbsoluteHttpUrl", () => {
  test.each(["https://www.youtube.com/embed/yY7RWGUbqng", "http://localhost:3000/videos/x.mp4"])(
    "accepts %s",
    (value) => {
      expect(isAbsoluteHttpUrl(value)).toBe(true);
    },
  );

  test.each([
    // The distinction that matters: `urlOrRelativePath` accepts a
    // site-relative path, but this predicate must not — callers use it to
    // decide what still needs resolving through the content store.
    ["/local-filesystem-lesson/course/module/lesson/video.mp4", "site-relative path"],
    ["basic-course/2-vowels/1-the-vowel-sound-schwa/video.mp4", "content key"],
    ["ftp://example.com/x", "non-http scheme"],
    ["", "empty"],
  ])("rejects %s (%s)", (value) => {
    expect(isAbsoluteHttpUrl(value)).toBe(false);
  });
});
