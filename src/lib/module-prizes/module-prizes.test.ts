import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { CATALOGUED_MODULE_SLUGS, prizeForModule } from "./module-prizes";

describe("prizeForModule", () => {
  test.each([
    ["1-introduction", "whistle"],
    ["2-vowels", "harmonica"],
    ["3-consonants", "megaphone"],
    ["4-ejercicios-para-dominar-el-ritmo-en-ingles", "drum"],
    ["5-fluidez-y-velocidad", "car"],
  ])("WHEN the Basic Course module %s is looked up THEN its prize is %s", (slug, prize) => {
    expect(prizeForModule(slug)).toBe(prize);
  });

  test.each([
    ["1-advanced-pronunciation-course", "microphone"],
    ["2-advanced-vowel-pronunciation-in-american-english", "kazoo"],
    ["3-contractions-reductions", "spring"],
    ["4-key-sound-patterns-and-features", "kaleidoscope"],
    ["5-sound-natural-american-intonation-essentials", "yoyo"],
    ["6-rules-for-speaking-fast-natural-in-english", "top"],
    ["7-everyday-english-phrases-part-1-master-them", "walkie"],
    ["8-everyday-english-phrases-part-2-master-them", "tinphone"],
    ["9-speak-with-confidence-in-30-days", "crown"],
    ["10-the-practice-zone-sharpen-your-skills", "robot"],
  ])("WHEN the advanced module %s is looked up THEN its prize is %s", (slug, prize) => {
    expect(prizeForModule(slug)).toBe(prize);
  });

  test("WHEN a module the catalog does not know is looked up THEN its prize is the gift box", () => {
    expect(prizeForModule(faker.helpers.slugify(faker.lorem.words(3)).toLowerCase())).toBe("gift");
  });

  test("WHEN the shipped content is read THEN every module slug has its own catalogued prize", () => {
    // A renamed module folder would silently fall back to the gift box; this
    // catches the rename before a learner does.
    const uncatalogued = contentCatalog.modules
      .map((module) => module.slug)
      .filter((slug) => !CATALOGUED_MODULE_SLUGS.includes(slug));

    expect(uncatalogued).toEqual([]);
  });
});
