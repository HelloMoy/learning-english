import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import * as stub from "./learner-actions-stub";

// The real module is a server file that cannot load here, so its exported
// action names are read from its source.
function actionsExportedBy(file: string): string[] {
  const source = readFileSync(path.resolve(__dirname, file), "utf8");
  return [...source.matchAll(/^export const (\w+Action)\b/gm)].map((match) => match[1]!).sort();
}

describe("learner-actions stub", () => {
  it("offers every learner action the app exports, so no story fails to load", () => {
    expect(Object.keys(stub).sort()).toEqual(
      actionsExportedBy("../src/app/[locale]/learner-actions.ts"),
    );
  });
});
