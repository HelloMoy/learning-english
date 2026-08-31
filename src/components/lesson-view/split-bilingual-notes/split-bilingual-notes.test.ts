import { describe, expect, test } from "vitest";

import { splitBilingualNotes } from "./split-bilingual-notes";

describe("splitBilingualNotes", () => {
  test("splits a title plus one language section per language into two columns", () => {
    const md = [
      "# Intro",
      "",
      "## 🇪🇸 Español",
      "",
      "Para sonar fluido y natural.",
      "",
      "## 🇺🇸 English",
      "",
      "To sound fluent and natural.",
    ].join("\n");
    expect(splitBilingualNotes(md)).toEqual({
      kind: "split",
      es: "Para sonar fluido y natural.",
      en: "To sound fluent and natural.",
    });
  });

  test("keeps nested sub-sections and lists inside each column", () => {
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
      "## 🇺🇸 English",
      "",
      "### Weak & Strong Forms",
      "",
      "Some small words are pronounced in a weaker way.",
    ].join("\n");
    const result = splitBilingualNotes(md);
    expect(result.kind).toBe("split");
    if (result.kind !== "split") throw new Error("expected split");
    expect(result.es).toBe(
      [
        "### Formas fuertes y débiles",
        "",
        "Algunas palabras se pronuncian más débiles.",
        "",
        "#### Por qué importa",
        "",
        "- Entiendes mejor a los nativos",
        "- Hablas de forma más natural",
      ].join("\n"),
    );
    expect(result.en).toBe(
      ["### Weak & Strong Forms", "", "Some small words are pronounced in a weaker way."].join(
        "\n",
      ),
    );
  });

  test("splits regardless of which language section comes first", () => {
    const md = ["## English", "", "English here.", "", "## Español", "", "Español aquí."].join(
      "\n",
    );
    expect(splitBilingualNotes(md)).toEqual({
      kind: "split",
      es: "Español aquí.",
      en: "English here.",
    });
  });

  test("renders a monolingual lesson in one column without its language heading", () => {
    const md = [
      "# Exercise 1",
      "",
      "## 🇺🇸 English",
      "",
      "In this lesson, we break down a clip.",
    ].join("\n");
    expect(splitBilingualNotes(md)).toEqual({
      kind: "single",
      markdown: "In this lesson, we break down a clip.",
    });
  });

  test("falls back to the original Markdown when no language section exists", () => {
    const md = "# Intro\n\nSolo un párrafo.";
    expect(splitBilingualNotes(md)).toEqual({ kind: "single", markdown: md });
  });

  test("ignores a level-2 section that is not a language marker", () => {
    const md = ["## Notas", "", "Contenido suelto."].join("\n");
    expect(splitBilingualNotes(md)).toEqual({ kind: "single", markdown: md });
  });

  test("handles empty input", () => {
    expect(splitBilingualNotes("")).toEqual({ kind: "single", markdown: "" });
    expect(splitBilingualNotes("   \n  ")).toEqual({ kind: "single", markdown: "" });
  });
});
