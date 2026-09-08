import fs from "node:fs";
import path from "node:path";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { splitBilingualNotes } from "../../src/components/lesson-view/split-bilingual-notes/split-bilingual-notes";
import basicCourse from "../../src/content/basic-course.json";
import { mirrorViolations, notesShapeViolations, type NotesEntry } from "./verify-notes-shape";

/** A conformant language section: a `###` sub-heading followed by prose. */
function languageSection(heading: string): string {
  return [`## ${heading}`, "", `### ${faker.lorem.sentence()}`, "", faker.lorem.paragraph()].join(
    "\n",
  );
}

function bilingualBody(): string {
  return ["# Title", "", languageSection("🇪🇸 Español"), "", languageSection("🇺🇸 English")].join(
    "\n",
  );
}

function entry(markdown: string) {
  return [{ path: "basic-course/module/lesson/readme.md", markdown }];
}

describe("notesShapeViolations", () => {
  test("WHEN a body carries both language sections with sub-headings THEN nothing is reported", () => {
    expect(notesShapeViolations(entry(bilingualBody()))).toEqual([]);
  });

  test("WHEN a body carries a single language section THEN nothing is reported", () => {
    const body = ["# Title", "", languageSection("English")].join("\n");

    expect(notesShapeViolations(entry(body))).toEqual([]);
  });

  test("WHEN a body has no language heading THEN it is reported as unmarked", () => {
    const body = ["# Title", "", faker.lorem.paragraph(), "", faker.lorem.paragraph()].join("\n");

    expect(notesShapeViolations(entry(body))).toEqual([
      "basic-course/module/lesson/readme.md: no level-2 language section heading",
    ]);
  });

  test("WHEN a body is only its title THEN it is reported as empty", () => {
    expect(notesShapeViolations(entry("# Title\n"))).toEqual([
      "basic-course/module/lesson/readme.md: body is empty below the title heading",
    ]);
  });

  test("WHEN a language section has no sub-heading THEN that section is reported", () => {
    const body = [
      "# Title",
      "",
      languageSection("🇪🇸 Español"),
      "",
      "## 🇺🇸 English",
      "",
      faker.lorem.paragraph(),
    ].join("\n");

    expect(notesShapeViolations(entry(body))).toEqual([
      'basic-course/module/lesson/readme.md: section "🇺🇸 English" has no ### sub-heading',
    ]);
  });

  test("WHEN a language section holds no prose THEN that section is reported", () => {
    const body = [
      "# Title",
      "",
      languageSection("Español"),
      "",
      "## English",
      "",
      "### Only a heading",
    ].join("\n");

    expect(notesShapeViolations(entry(body))).toEqual([
      'basic-course/module/lesson/readme.md: section "English" has no prose below its sub-heading',
    ]);
  });

  test("WHEN several files are non-conformant THEN each is reported, in the order given", () => {
    const entries = [
      { path: "a/readme.md", markdown: "# A\n" },
      { path: "b/readme.md", markdown: bilingualBody() },
      { path: "c/readme.md", markdown: `# C\n\n${faker.lorem.paragraph()}` },
    ];

    expect(notesShapeViolations(entries)).toEqual([
      "a/readme.md: body is empty below the title heading",
      "c/readme.md: no level-2 language section heading",
    ]);
  });
});

describe("mirrorViolations", () => {
  function bilingual(es: string, en: string): NotesEntry[] {
    return [
      { path: "lesson/readme.md", markdown: `# T\n\n## Español\n\n${es}\n\n## English\n\n${en}` },
    ];
  }

  const SPANISH = "### Sub\n\nUn párrafo.\n\n- uno\n- dos\n\n**Lo oyes en:** *cat* · *bat*";
  const ENGLISH = "### Sub\n\nA paragraph.\n\n- one\n- two\n\n**You hear it in:** *cat* · *bat*";

  test("WHEN both sections share a skeleton and examples THEN nothing is reported", () => {
    expect(mirrorViolations(bilingual(SPANISH, ENGLISH))).toEqual([]);
  });

  test("WHEN one section has an extra bullet THEN the skeleton mismatch is reported", () => {
    const violations = mirrorViolations(
      bilingual(SPANISH.replace("- dos", "- dos\n\n- tres"), ENGLISH),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("skeleton");
  });

  test("WHEN one section drops its sub-heading THEN the skeleton mismatch is reported", () => {
    const violations = mirrorViolations(bilingual(SPANISH, ENGLISH.replace("### Sub\n\n", "")));

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("skeleton");
  });

  test("WHEN the columns list different example words THEN the mismatch is reported", () => {
    const violations = mirrorViolations(bilingual(SPANISH, ENGLISH.replace("*bat*", "*bad*")));

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("example words");
  });

  test("WHEN a body has only one language section THEN it is not a mirror problem", () => {
    const entry = [{ path: "lesson/readme.md", markdown: `# T\n\n## English\n\n${ENGLISH}` }];

    expect(mirrorViolations(entry)).toEqual([]);
  });
});

const BASIC_COURSE_ROOT = path.join(
  process.cwd(),
  "public/local-filesystem-lesson",
  basicCourse.slug,
);

/** Every lesson notes file the Basic Course manifest declares, read from disk. */
function declaredNotes(): NotesEntry[] {
  return basicCourse.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.notesKey !== undefined)
    .map((lesson) => {
      const relativeToCourse = lesson.notesKey.slice(`${basicCourse.slug}/`.length);
      return {
        path: lesson.notesKey,
        markdown: fs.readFileSync(path.join(BASIC_COURSE_ROOT, relativeToCourse), "utf8"),
      };
    });
}

/** The lesson's `#` title heading, which feeds manifest title derivation. */
function titleHeading(markdown: string): string | null {
  const heading = markdown.split("\n").find((line) => line.startsWith("# "));
  return heading === undefined ? null : heading.slice(2).trim();
}

/**
 * The `#` title heading every Basic Course lesson notes file must carry.
 *
 * Recorded, not derived: this heading is title-derivation input for
 * `pnpm sync:manifest`, so a body rewrite that touches it silently changes
 * `src/content/basic-course.json`. Four lessons carry a hand-edited manifest
 * title that deliberately differs from their heading, which is why the guard
 * pins the headings themselves rather than comparing them to the manifest.
 */
const TITLE_HEADINGS: Readonly<Record<string, string>> = {
  "basic-course/1-introduction/1-introduction/readme.md":
    "La Forma Más Rápida de Mejorar tu Speaking and Listening! Que Necesitas?",
  "basic-course/2-vowels/1-the-vowel-sound-schwa/readme.md":
    "The Vowel Sound: /ə/ (El más importante)",
  "basic-course/2-vowels/2-the-vowel-sound-ih/readme.md": "The Vowel Sound /ɪ/ (e corta)",
  "basic-course/2-vowels/3-the-vowel-sound-uu/readme.md": "The Vowel Sound /ʊ/ (o corta)",
  "basic-course/2-vowels/4-schwa-or-strut/readme.md": "Schwa /ə/ or Strut /ʌ/ ?",
  "basic-course/2-vowels/5-the-weak-vowel-merger/readme.md": "The weak-vowel merger",
  "basic-course/2-vowels/6-the-vowel-sound-ae/readme.md": "The vowel sound /æ/ (a ligada)",
  "basic-course/2-vowels/7-the-vowel-sound-ah/readme.md": "the vowel sound /ɑ/",
  "basic-course/2-vowels/8-the-vowel-sound-aw/readme.md": "The Vowel sound /ɔ/",
  "basic-course/2-vowels/9-the-cot-caught-merger/readme.md": "The cot–caught merger!",
  "basic-course/2-vowels/10-the-vowel-sound-eh/readme.md": "The Vowel Sound /ɛ/",
  "basic-course/2-vowels/11-the-vowel-sound-u/readme.md": "The Vowel Sound /u/",
  "basic-course/2-vowels/12-the-vowel-sound-i/readme.md": "The vowel sound /i/",
  "basic-course/2-vowels/13-diphthong-sound-ai/readme.md": "Diphthong Sound /aɪ/",
  "basic-course/2-vowels/14-diphthong-sound-au/readme.md": "Diphthong Sound /aʊ/",
  "basic-course/2-vowels/15-diphthong-sound-oi/readme.md": "Diphthong Sound /ɔɪ/",
  "basic-course/2-vowels/16-diphthong-sound-ei/readme.md": "Diphthong Sound /eɪ/",
  "basic-course/2-vowels/17-diphthong-sound-ou/readme.md": "Diphthong Sound /ɔʊ/",
  "basic-course/3-consonants/1-activar-las-cuerdas-vocales/readme.md":
    "Ejercicio para activar las cuerdas vocales",
  "basic-course/3-consonants/2-consonantes-plosivas-y-de-parada/readme.md":
    "Consonantes Plosivas y de Parada",
  "basic-course/3-consonants/3-r/readme.md": "/r/",
  "basic-course/3-consonants/4-flap/readme.md": "/Flap/",
  "basic-course/3-consonants/5-vocales-roticas/readme.md": "Vocales Róticas",
  "basic-course/3-consonants/6-dark-l-part-1/readme.md": "Dark /L/ Part 1",
  "basic-course/3-consonants/7-dark-l-part-2/readme.md": "Dark /L/ Part 2",
  "basic-course/3-consonants/8-sh/readme.md": "/ʃ/",
  "basic-course/3-consonants/9-ch/readme.md": "/tʃ/",
  "basic-course/3-consonants/10-zh/readme.md": "/ʒ/",
  "basic-course/3-consonants/11-dzh/readme.md": "/dʒ/",
  "basic-course/3-consonants/12-th-voiceless/readme.md": "/θ/",
  "basic-course/3-consonants/13-th-voiced/readme.md": "/ð/",
  "basic-course/3-consonants/14-interdental-d-t/readme.md": "Interdental /d̪/ & /t̪/",
  "basic-course/3-consonants/15-s/readme.md": "/s/",
  "basic-course/3-consonants/16-z/readme.md": "/z/",
  "basic-course/3-consonants/17-f/readme.md": "/f/",
  "basic-course/3-consonants/18-v/readme.md": "/v/",
  "basic-course/3-consonants/19-n/readme.md": "/n/",
  "basic-course/3-consonants/20-m/readme.md": "/m/",
  "basic-course/3-consonants/21-ng/readme.md": "/ŋ/",
  "basic-course/3-consonants/22-w/readme.md": "/w/",
  "basic-course/3-consonants/23-j/readme.md": "/j/",
  "basic-course/3-consonants/24-h/readme.md": "/H/",
  "basic-course/3-consonants/25-x/readme.md": "/X/",
  "basic-course/4-ejercicios-para-dominar-el-ritmo-en-ingles/1-afina-tu-oido-y-pronunciacion/readme.md":
    "Afina tu oído y pronunciación",
  "basic-course/4-ejercicios-para-dominar-el-ritmo-en-ingles/2-ejercicios-para-afinar-tu-oido-y-pronunciacion-2/readme.md":
    "Ejercicios para afinar tu oído y pronunciación 2",
  "basic-course/4-ejercicios-para-dominar-el-ritmo-en-ingles/3-ejercicios-para-afinar-tu-oido-y-pronunciacion-3-an-at/readme.md":
    'Ejercicios para afinar tu oído y pronunciación 3 "AN-AT"',
  "basic-course/4-ejercicios-para-dominar-el-ritmo-en-ingles/4-como-pronunciar-cualquier-palabra-en-ingles/readme.md":
    "Cómo pronunciar cualquier palabra en Inglés!",
  "basic-course/5-fluidez-y-velocidad/1-ejercita-las-vocales-y-la-flap-con-esta-cancion/readme.md":
    "Ejercita las Vocales y la Flap con esta canción",
};

describe("the basic-course corpus", () => {
  const notes = declaredNotes();

  test("WHEN the manifest declares notes THEN every one of them exists on disk", () => {
    expect(notes.length).toBeGreaterThan(0);
  });

  test("WHEN every declared notes body is checked THEN none violates the notes shape", () => {
    expect(notesShapeViolations(notes)).toEqual([]);
  });

  test("WHEN the two columns of each lesson are compared THEN they mirror each other", () => {
    expect(mirrorViolations(notes)).toEqual([]);
  });

  test("WHEN every declared notes body is split THEN each yields two language columns", () => {
    const unsplit = notes
      .filter(({ markdown }) => splitBilingualNotes(markdown).kind !== "split")
      .map(({ path: notesPath }) => notesPath);

    expect(unsplit).toEqual([]);
  });

  test("WHEN a body is rewritten THEN its `#` title heading is unchanged", () => {
    const headings = Object.fromEntries(
      notes.map(({ path: notesPath, markdown }) => [notesPath, titleHeading(markdown)]),
    );

    expect(headings).toEqual(TITLE_HEADINGS);
  });
});
