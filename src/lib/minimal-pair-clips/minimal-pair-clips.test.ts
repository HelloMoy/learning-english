import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { MINIMAL_PAIR_CLIPS } from "./minimal-pair-clips";

describe("MINIMAL_PAIR_CLIPS", () => {
  test("WHEN read THEN it names one clip per word of the ship/sheep pair", () => {
    expect(Object.keys(MINIMAL_PAIR_CLIPS).sort()).toEqual(["sheep", "ship"]);
  });

  test("WHEN read THEN every clip is served from public/audio/minimal-pairs under its word", () => {
    for (const [word, path] of Object.entries(MINIMAL_PAIR_CLIPS)) {
      expect(path).toBe(`/audio/minimal-pairs/${word}.mp3`);
    }
  });

  test("WHEN the app is built THEN every clip file exists", () => {
    for (const path of Object.values(MINIMAL_PAIR_CLIPS)) {
      expect(existsSync(join(process.cwd(), "public", path))).toBe(true);
    }
  });
});
