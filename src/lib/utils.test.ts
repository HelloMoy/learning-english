import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    const a = faker.lorem.word();
    const b = faker.lorem.word();
    expect(cn(a, b)).toBe(`${a} ${b}`);
  });

  it("ignores falsy values", () => {
    const word = faker.lorem.word();
    expect(cn(word, false, null, undefined, 0, "")).toBe(word);
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    const activeKey = faker.lorem.word();
    const disabledKey = faker.lorem.word();
    expect(cn("base", { [activeKey]: true, [disabledKey]: false })).toBe(`base ${activeKey}`);
  });
});
