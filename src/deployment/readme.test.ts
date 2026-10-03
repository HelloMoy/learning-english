// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

/**
 * Guards the `repo-readme` capability: the README opens with the three
 * environments, repeats their addresses as text, and only shows images, names
 * scripts and links files that exist in the repository.
 */

const ROOT = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");
const readme = read("README.md");

const ENVIRONMENTS = [
  { name: "live app", host: "www.english-course.online" },
  { name: "develop preview", host: "develop.english-course.online" },
  { name: "docs portal", host: "docs.english-course.online" },
];

describe("the README's opening", () => {
  test("links the live app, the develop preview and the docs portal, in that order", () => {
    expect(buttons().map(({ href }) => href)).toEqual(ENVIRONMENTS.map(addressOf));
  });

  test("has dropped the create-next-app scaffold", () => {
    expect(readme).not.toContain("create-next-app");
  });
});

describe("the Environments table", () => {
  test.each(ENVIRONMENTS)("gives $host as a text link", (environment) => {
    expect(readme).toContain(`[${environment.host}](${addressOf(environment)})`);
  });

  test("says the develop preview is behind Vercel sign-in", () => {
    expect(tableRowAbout("develop.english-course.online")).toContain("Vercel sign-in");
  });
});

describe("the README's images", () => {
  test("every image kept in the repository exists", () => {
    const missing = images()
      .map(({ src }) => src)
      .filter(isRepositoryPath)
      .filter(isMissing);

    expect(missing).toEqual([]);
  });

  test("every image has alternative text", () => {
    const undescribed = images().filter(({ alt }) => alt.trim() === "");

    expect(undescribed).toEqual([]);
  });

  test.each(ENVIRONMENTS)("the $name button paints and describes $host", (environment) => {
    const button = buttonTo(environment);

    expect(button.alt).toContain(environment.host);
    expect(read(button.src)).toContain(environment.host);
  });
});

describe("what the README tells a reader to use", () => {
  test("every pnpm script it names exists in package.json", () => {
    const scripts = Object.keys(JSON.parse(read("package.json")).scripts);
    const unknown = namedPnpmCommands().filter(
      (command) => !PNPM_BUILT_INS.includes(command) && !scripts.includes(command),
    );

    expect(unknown).toEqual([]);
  });

  test("every repository file it links to exists", () => {
    const broken = linkTargets().filter(isRepositoryPath).filter(isMissing);

    expect(broken).toEqual([]);
  });
});

describe("running it locally", () => {
  test("names what must be installed first", () => {
    expect(readme).toContain("Needs Node 22+, pnpm and Docker.");
  });

  test("takes a fresh clone to a running app, in order", () => {
    expect(setupCommands()).toEqual([
      "pnpm install",
      "cp .env.example .env.local",
      "docker compose up -d",
      "pnpm db:migrate",
      "pnpm db:seed",
      "pnpm dev",
    ]);
  });

  test("the files those commands read exist", () => {
    expect([".env.example", "compose.yaml"].filter(isMissing)).toEqual([]);
  });
});

type Environment = (typeof ENVIRONMENTS)[number];
type Image = { src: string; alt: string };
type ImageLink = Image & { href: string };

const PNPM_BUILT_INS = ["install"];

function addressOf({ host }: Environment): string {
  return `https://${host}`;
}

function buttonTo(environment: Environment): ImageLink {
  const button = buttons().find(({ href }) => href === addressOf(environment));
  if (!button) throw new Error(`The README has no button linking to ${environment.host}`);

  return button;
}

/** A button is a linked image the repository keeps; a linked remote image is a badge. */
function buttons(): ImageLink[] {
  return imageLinks().filter(({ src }) => isRepositoryPath(src));
}

function imageLinks(): ImageLink[] {
  const linkedImage = /<a href="([^"]+)">\s*(<img\s[^>]*>)\s*<\/a>/g;

  return [...readme.matchAll(linkedImage)].map(([, href, tag]) => ({ href, ...imageIn(tag) }));
}

function images(): Image[] {
  const htmlImages = [...readme.matchAll(/<img\s[^>]*>/g)].map(([tag]) => imageIn(tag));
  const markdownImages = [...readme.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map(
    ([, alt, src]) => ({ src, alt }),
  );

  return [...htmlImages, ...markdownImages];
}

function imageIn(tag: string): Image {
  return { src: attributeOf(tag, "src"), alt: attributeOf(tag, "alt") };
}

function attributeOf(tag: string, name: string): string {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? "";
}

function tableRowAbout(text: string): string {
  const row = readme.split("\n").find((line) => line.startsWith("|") && line.includes(text));

  return row ?? "";
}

/** Commands in code only — a fenced line or an inline span — so prose like "pnpm and Docker" is not one. */
function namedPnpmCommands(): string[] {
  return [...readme.matchAll(/(?:^|`)pnpm (?:run )?([\w:-]+)/gm)].map(([, command]) => command);
}

function setupCommands(): string[] {
  const firstShellBlock = /```bash\n([\s\S]*?)```/.exec(readme)?.[1] ?? "";

  return firstShellBlock
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((command) => command !== "");
}

function linkTargets(): string[] {
  return [...readme.matchAll(/\]\(([^)\s]+)\)/g)].map(([, target]) => target);
}

function isRepositoryPath(target: string): boolean {
  return !/^(https?:|mailto:|#)/.test(target);
}

function isMissing(repositoryPath: string): boolean {
  return !existsSync(path.join(ROOT, repositoryPath));
}
