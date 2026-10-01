import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  countModulesInLayer,
  displayModuleName,
  folderOf,
  groupModulesByFolder,
  HEXAGON_LAYERS,
  ROOT_FOLDER,
} from "./module-index.mts";

function slug(): string {
  return faker.helpers.slugify(faker.word.words(2)).toLowerCase();
}

function modulesNamed(...names: string[]): { name: string }[] {
  return names.map((name) => ({ name }));
}

describe("displayModuleName", () => {
  test("collapses a final segment that repeats its folder", () => {
    const leaf = slug();

    expect(displayModuleName(`lib/${leaf}/${leaf}`)).toBe(`lib/${leaf}`);
  });

  test("keeps a final segment that differs from its folder", () => {
    expect(displayModuleName("domain/use-cases/find-next-lesson/find-next-lesson.errors")).toBe(
      "domain/use-cases/find-next-lesson/find-next-lesson.errors",
    );
  });

  test("keeps a single-segment name", () => {
    expect(displayModuleName("proxy")).toBe("proxy");
  });
});

describe("folderOf", () => {
  test("is the first segment for most modules", () => {
    const leaf = slug();

    expect(folderOf(`hooks/${leaf}/${leaf}`)).toBe("hooks");
  });

  test("is the first two segments under domain", () => {
    expect(folderOf("domain/use-cases/mark-lesson-complete/mark-lesson-complete")).toBe(
      "domain/use-cases",
    );
  });

  test("is the root label for a top-level module", () => {
    expect(folderOf("proxy")).toBe(ROOT_FOLDER);
  });
});

describe("groupModulesByFolder", () => {
  test("puts the hexagon layers first, in layer order, then the rest alphabetically", () => {
    const modules = modulesNamed(
      "lib/format-duration/format-duration",
      "components/brand/brand",
      "app/sitemap",
      "hooks/use-count-up/use-count-up",
      "domain/ports/clock/clock",
      "adapters/email/email-sender",
      "domain/entities/course/course",
      "domain/use-cases/find-next-lesson/find-next-lesson",
    );

    expect(groupModulesByFolder(modules).map((group) => group.folder)).toEqual([
      "domain/use-cases",
      "domain/ports",
      "domain/entities",
      "adapters",
      "hooks",
      "components",
      "app",
      "lib",
    ]);
  });

  test("keeps each group's modules in their original order", () => {
    const modules = modulesNamed("hooks/use-b/use-b", "hooks/use-a/use-a");

    expect(groupModulesByFolder(modules)[0].modules).toEqual(modules);
  });
});

describe("countModulesInLayer", () => {
  test("counts the modules under a folder", () => {
    const modules = modulesNamed("hooks/use-a/use-a", "hooks/use-b/use-b", "lib/x/x");

    expect(countModulesInLayer(modules, "hooks")).toBe(2);
  });

  test("does not count a sibling folder that shares the prefix", () => {
    const modules = modulesNamed("hooks/use-a/use-a", "hooks-legacy/use-b/use-b");

    expect(countModulesInLayer(modules, "hooks")).toBe(1);
  });
});

describe("HEXAGON_LAYERS", () => {
  test("lists the six layers the home page shows, innermost first", () => {
    expect(HEXAGON_LAYERS.map((layer) => layer.folder)).toEqual([
      "domain/use-cases",
      "domain/ports",
      "domain/entities",
      "adapters",
      "hooks",
      "components",
    ]);
  });
});
