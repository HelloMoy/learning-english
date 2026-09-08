import { describe, expect, test } from "vitest";

import { youtubeVideoIdFrom } from "./youtube-source";

/**
 * Video ids are hardcoded rather than faked: the exact string that comes back
 * IS the behavior under test, so a generated one would only obscure which
 * character of which URL form the parser mishandled.
 */
const VIDEO_ID = "yY7RWGUbqng";

describe("youtubeVideoIdFrom", () => {
  describe("GIVEN a YouTube link", () => {
    test.each([
      [
        `https://www.youtube.com/embed/${VIDEO_ID}?si=nB8sjE4SQJoB0Itv`,
        "an embed link with a share parameter",
      ],
      [
        `https://www.youtube.com/watch?v=${VIDEO_ID}&list=PLabc123`,
        "a watch link inside a playlist",
      ],
      [`https://youtu.be/${VIDEO_ID}?t=42`, "a short link with a start offset"],
      [`https://www.youtube.com/shorts/${VIDEO_ID}`, "a Shorts link"],
    ])("WHEN given %s THEN it returns the video id (%s)", (source) => {
      expect(youtubeVideoIdFrom(source)).toBe(VIDEO_ID);
    });
  });

  describe("GIVEN a YouTube link on one of the site's other hosts", () => {
    test.each([
      [`https://youtube.com/watch?v=${VIDEO_ID}`, "no subdomain"],
      [`https://m.youtube.com/watch?v=${VIDEO_ID}`, "the mobile subdomain"],
      [`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`, "the privacy-enhanced domain"],
      [`https://youtu.be/${VIDEO_ID}`, "the short link with no parameters"],
    ])("WHEN given %s THEN it returns the video id (%s)", (source) => {
      expect(youtubeVideoIdFrom(source)).toBe(VIDEO_ID);
    });
  });

  describe("GIVEN a source that is not a YouTube link", () => {
    test.each([
      ["/videos/long-vs-short.mp4", "a site-relative self-hosted file"],
      ["https://files.example.com/lecture.mp4", "an absolute self-hosted file"],
      ["https://vimeo.com/123456", "another video host"],
      ["not a url at all", "a malformed source, which must degrade rather than throw"],
      ["", "an empty source"],
    ])("WHEN given %s THEN it returns undefined (%s)", (source) => {
      expect(youtubeVideoIdFrom(source)).toBeUndefined();
    });

    test("WHEN the host only LOOKS like YouTube in its path THEN it returns undefined", () => {
      // The whole reason this parses the URL instead of scanning the string:
      // a self-hosted file whose path happens to spell out a YouTube URL must
      // stay a self-hosted file.
      expect(
        youtubeVideoIdFrom(`https://cdn.example.com/youtube.com/watch?v=${VIDEO_ID}.mp4`),
      ).toBeUndefined();
    });
  });

  describe("GIVEN a YouTube URL that carries no video", () => {
    test.each([
      ["https://www.youtube.com/", "the site root"],
      ["https://www.youtube.com/watch", "a watch page with no `v` parameter"],
      ["https://www.youtube.com/watch?v=", "a watch page with an empty `v`"],
      ["https://www.youtube.com/embed/", "an embed path with no id"],
      ["https://www.youtube.com/feed/subscriptions", "a page that is not a video"],
      ["https://youtu.be/", "a short link with no id"],
    ])("WHEN given %s THEN it returns undefined (%s)", (source) => {
      expect(youtubeVideoIdFrom(source)).toBeUndefined();
    });
  });
});
