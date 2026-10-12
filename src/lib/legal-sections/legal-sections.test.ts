import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  legalSections,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTION_KEYS,
  TERMS_LAST_UPDATED,
} from "./legal-sections";

/**
 * Guards the `legal-pages` capability's "The privacy text names every
 * processor the code actually uses": reading order is the document's meaning.
 */

describe("PRIVACY_SECTION_KEYS", () => {
  test("usage data has its own passage, read right after error reports", () => {
    const errorReports = PRIVACY_SECTION_KEYS.indexOf("errorReports");

    expect(PRIVACY_SECTION_KEYS[errorReports + 1]).toBe("usageData");
  });

  test("the passages about what is collected come before cookies and the reader's choices", () => {
    const order = (key: (typeof PRIVACY_SECTION_KEYS)[number]) => PRIVACY_SECTION_KEYS.indexOf(key);

    expect(order("usageData")).toBeLessThan(order("cookies"));
    expect(order("cookies")).toBeLessThan(order("yourChoices"));
  });
});

describe("legalSections", () => {
  test("resolves each passage's heading and body, in the order the keys declare", () => {
    const prefix = faker.lorem.word();
    const translate = (key: string) => `${prefix}:${key}`;

    const sections = legalSections(translate, PRIVACY_SECTION_KEYS);

    expect(sections).toEqual(
      PRIVACY_SECTION_KEYS.map((key) => ({
        heading: `${prefix}:sections.${key}.heading`,
        body: `${prefix}:sections.${key}.body`,
      })),
    );
  });
});

describe("the last-updated dates", () => {
  test("the terms still carry the day their own wording last changed", () => {
    expect(TERMS_LAST_UPDATED.toISOString()).toBe("2026-09-22T00:00:00.000Z");
  });

  test("the privacy policy carries the day usage data was added to it", () => {
    expect(PRIVACY_LAST_UPDATED.toISOString()).toBe("2026-10-10T00:00:00.000Z");
  });
});
