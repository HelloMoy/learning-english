import { describe, expect, test } from "vitest";

import { splitBilingualNotes } from "./split-bilingual-notes";

describe("splitBilingualNotes", () => {
  test("splits a heading + ES paragraph + EN paragraph into two columns", () => {
    const md = [
      "# Intro",
      "",
      "Para sonar fluido y natural.",
      "",
      "To sound fluent and natural.",
    ].join("\n");
    const result = splitBilingualNotes(md);
    expect(result.kind).toBe("split");
    if (result.kind !== "split") throw new Error("expected split");
    expect(result.es).toBe("Para sonar fluido y natural.");
    expect(result.en).toBe("To sound fluent and natural.");
  });

  test("splits two paragraphs even without a leading heading", () => {
    const md = ["Español aquí.", "", "English here."].join("\n");
    const result = splitBilingualNotes(md);
    expect(result.kind).toBe("split");
  });

  test("falls back to a single column when only one body block exists", () => {
    const result = splitBilingualNotes("# Intro\n\nSolo un párrafo.");
    expect(result).toEqual({ kind: "single", markdown: "# Intro\n\nSolo un párrafo." });
  });

  test("falls back to a single column when the split is ambiguous (>2 blocks)", () => {
    const md = ["Uno.", "", "Dos.", "", "Tres."].join("\n");
    const result = splitBilingualNotes(md);
    expect(result.kind).toBe("single");
  });

  test("handles empty input", () => {
    expect(splitBilingualNotes("")).toEqual({ kind: "single", markdown: "" });
    expect(splitBilingualNotes("   \n  ")).toEqual({ kind: "single", markdown: "" });
  });
});
