import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { MAILPIT_IMAGE } from "./mailpit-container";

describe("MAILPIT_IMAGE", () => {
  test("is the image compose.yaml runs", () => {
    const compose = readFileSync(path.resolve(__dirname, "../../../compose.yaml"), "utf8");

    expect(compose).toContain(`image: ${MAILPIT_IMAGE}`);
  });
});
