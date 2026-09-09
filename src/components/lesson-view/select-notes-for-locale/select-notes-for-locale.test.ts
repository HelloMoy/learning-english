import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { selectNotesForLocale } from "./select-notes-for-locale";

const trilingual = (es: string, en: string, pt: string): string =>
  [
    "# Intro",
    "",
    "## 🇪🇸 Español",
    "",
    es,
    "",
    "## 🇺🇸 English",
    "",
    en,
    "",
    "## 🇧🇷 Português",
    "",
    pt,
  ].join("\n");

describe("selectNotesForLocale", () => {
  test("returns the section of the requested locale, one language at a time", () => {
    const [es, en, pt] = [faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()];
    const md = trilingual(es, en, pt);

    expect(selectNotesForLocale(md, "es")).toBe(es);
    expect(selectNotesForLocale(md, "en")).toBe(en);
    expect(selectNotesForLocale(md, "pt")).toBe(pt);
  });

  test("drops the language heading and the title above it", () => {
    const md = trilingual("Sólo español.", "English only.", "Só português.");

    expect(selectNotesForLocale(md, "es")).not.toContain("Español");
    expect(selectNotesForLocale(md, "es")).not.toContain("# Intro");
  });

  test("keeps nested sub-headings, lists and blockquotes inside the selected section", () => {
    const md = [
      "# Weak & Strong Forms",
      "",
      "## 🇪🇸 Español",
      "",
      "### Formas fuertes y débiles",
      "",
      "Algunas palabras se pronuncian más débiles.",
      "",
      "#### Por qué importa",
      "",
      "- Entiendes mejor a los nativos",
      "- Hablas de forma más natural",
      "",
      "> ⚠️ Practica en voz alta.",
      "",
      "## 🇺🇸 English",
      "",
      "### Weak & Strong Forms",
      "",
      "Some small words are pronounced in a weaker way.",
    ].join("\n");

    expect(selectNotesForLocale(md, "es")).toBe(
      [
        "### Formas fuertes y débiles",
        "",
        "Algunas palabras se pronuncian más débiles.",
        "",
        "#### Por qué importa",
        "",
        "- Entiendes mejor a los nativos",
        "- Hablas de forma más natural",
        "",
        "> ⚠️ Practica en voz alta.",
      ].join("\n"),
    );
  });

  test("selects by language, not by the order the sections appear in the file", () => {
    const md = [
      "## Português",
      "",
      "Português aqui.",
      "",
      "## English",
      "",
      "English here.",
      "",
      "## Español",
      "",
      "Español aquí.",
    ].join("\n");

    expect(selectNotesForLocale(md, "es")).toBe("Español aquí.");
    expect(selectNotesForLocale(md, "pt")).toBe("Português aqui.");
  });

  test("matches a language heading with or without its flag emoji", () => {
    const withFlag = ["## 🇧🇷 Português", "", "Com bandeira."].join("\n");
    const withoutFlag = ["## Português", "", "Sem bandeira."].join("\n");

    expect(selectNotesForLocale(withFlag, "pt")).toBe("Com bandeira.");
    expect(selectNotesForLocale(withoutFlag, "pt")).toBe("Sem bandeira.");
  });

  test("reads a language named in another language's words", () => {
    const md = ["## Inglés", "", "English here.", "", "## Spanish", "", "Español aquí."].join("\n");

    expect(selectNotesForLocale(md, "en")).toBe("English here.");
    expect(selectNotesForLocale(md, "es")).toBe("Español aquí.");
  });

  test("reads a language named in Portuguese's words", () => {
    const md = ["## Espanhol", "", "Español aquí.", "", "## Inglês", "", "English here."].join(
      "\n",
    );

    expect(selectNotesForLocale(md, "es")).toBe("Español aquí.");
    expect(selectNotesForLocale(md, "en")).toBe("English here.");
  });

  test("reads `Portugués` as Portuguese, never as Spanish", () => {
    const md = ["## Portugués", "", "Português aqui.", "", "## English", "", "English here."].join(
      "\n",
    );

    expect(selectNotesForLocale(md, "pt")).toBe("Português aqui.");
    expect(selectNotesForLocale(md, "es")).toBe("English here.");
  });

  test("ignores a level-2 section whose heading names no language", () => {
    const md = ["## Notas", "", "Contenido suelto.", "", "## Español", "", "Español aquí."].join(
      "\n",
    );

    expect(selectNotesForLocale(md, "es")).toBe("Español aquí.");
  });

  test("falls back to English when the requested locale has no section", () => {
    const md = ["## Español", "", "Español aquí.", "", "## English", "", "English here."].join(
      "\n",
    );

    expect(selectNotesForLocale(md, "pt")).toBe("English here.");
  });

  test("falls back to Spanish when neither the requested locale nor English is present", () => {
    const md = ["## Español", "", "Español aquí."].join("\n");

    expect(selectNotesForLocale(md, "pt")).toBe("Español aquí.");
    expect(selectNotesForLocale(md, "en")).toBe("Español aquí.");
  });

  test("returns the whole body when no language section exists", () => {
    const md = "# Intro\n\nSolo un párrafo.";

    expect(selectNotesForLocale(md, "es")).toBe(md);
  });

  test("returns an empty string for an empty body", () => {
    expect(selectNotesForLocale("", "es")).toBe("");
    expect(selectNotesForLocale("   \n  ", "pt")).toBe("");
  });

  test("falls back to English for a locale the notes never carry", () => {
    const md = trilingual("Español aquí.", "English here.", "Português aqui.");

    expect(selectNotesForLocale(md, faker.helpers.arrayElement(["fr", "de", "it"]))).toBe(
      "English here.",
    );
  });
});
