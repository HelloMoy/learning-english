// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { SIDEBAR } from "../../docs-portal/src/navigation.mjs";
import {
  NEW_TAB,
  opensOutsideStarlight,
  paginationWithinStarlight,
} from "../../docs-portal/src/outbound-links.mjs";
import { readReleaseSummary } from "../../docs-portal/src/release-summary.mjs";

const ROOT = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

/**
 * Guards the `portal-outbound-links` capability and the portal home: which
 * links leave the pages Starlight renders, how they open, and the data the
 * home page reads at build time.
 */

describe("opensOutsideStarlight", () => {
  test.each([
    "/storybook/",
    "/storybook/?path=/docs/docs-welcome--docs",
    "/api/",
    "/api/modules.html",
    "/architecture/layers.svg",
    "/emails/verify-email.es.html",
    "https://github.com/HelloMoy/learning-english",
    "http://example.com",
    "mailto:team@example.com",
  ])("%s leaves Starlight", (href) => {
    expect(opensOutsideStarlight(href)).toBe(true);
  });

  test.each(["/", "/emails/", "/architecture/", "/changelog/", "#v050", "changelog/"])(
    "%s stays in Starlight",
    (href) => {
      expect(opensOutsideStarlight(href)).toBe(false);
    },
  );
});

describe("paginationWithinStarlight", () => {
  const page = (href: string) => ({ href, label: href });

  test("drops a previous or next link that would leave Starlight", () => {
    expect(
      paginationWithinStarlight({ prev: page("/api/"), next: page("/architecture/") }),
    ).toEqual({ prev: undefined, next: page("/architecture/") });
  });

  test("keeps links between Starlight pages", () => {
    const pagination = { prev: page("/emails/"), next: page("/changelog/") };

    expect(paginationWithinStarlight(pagination)).toEqual(pagination);
  });
});

describe("NEW_TAB", () => {
  test("opens a new tab without handing it the portal", () => {
    expect(NEW_TAB).toEqual({ target: "_blank", rel: "noopener noreferrer" });
  });
});

describe("the portal sidebar", () => {
  test("lists every reference, in order", () => {
    expect(SIDEBAR.map(({ label, link }) => [label, link])).toEqual([
      ["Design system", "/storybook/"],
      ["API reference", "/api/"],
      ["Emails", "/emails/"],
      ["Architecture", "/architecture/"],
      ["Changelog", "/changelog/"],
    ]);
  });

  test.each(SIDEBAR.map((entry) => [entry.link, entry] as const))(
    "opens %s in a new tab exactly when it leaves Starlight",
    (link, entry) => {
      expect("attrs" in entry ? entry.attrs : undefined).toEqual(
        opensOutsideStarlight(link) ? NEW_TAB : undefined,
      );
    },
  );
});

describe("the portal's Markdown links", () => {
  const astroConfig = read("docs-portal/astro.config.mjs");

  test("open in a new tab when they leave Starlight, through rehype-external-links", () => {
    expect(astroConfig).toMatch(/import rehypeExternalLinks from "rehype-external-links";/);
    expect(astroConfig).toMatch(
      /rehypePlugins: \[\s*\[\s*rehypeExternalLinks,\s*\{\s*test: \(element\) => opensOutsideStarlight\(String\(element\.properties\.href\)\)/,
    );
  });
});

/** Every page and component source under the portal's `src/`. */
function portalSources(): string[] {
  return readdirSync(path.join(ROOT, "docs-portal/src"), { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(mdx|astro)$/.test(file))
    .map((file) => `docs-portal/src/${file}`);
}

const HTML_LINK = /<a\b[^>]*>/g;
const HREF = /\bhref="([^"]+)"/;

function linksLeavingStarlightWithoutNewTab(file: string): string[] {
  return [...read(file).matchAll(HTML_LINK)]
    .map(([tag]) => tag)
    .filter((tag) => {
      const href = HREF.exec(tag)?.[1];
      return href !== undefined && opensOutsideStarlight(href) && !/target="_blank"/.test(tag);
    })
    .map((tag) => `${file}: ${HREF.exec(tag)?.[1]}`);
}

describe("HTML links in portal pages", () => {
  test("open in a new tab whenever they leave Starlight", () => {
    expect(portalSources().flatMap(linksLeavingStarlightWithoutNewTab)).toEqual([]);
  });
});

describe("readReleaseSummary", () => {
  /** A stand-in for git: answers each command from a table, or throws like git does. */
  const fakeGit =
    (answers: Record<string, string>) =>
    (...args: string[]): string => {
      const answer = answers[args.join(" ")];
      if (answer === undefined) throw new Error(`fatal: git ${args.join(" ")}`);
      return answer;
    };

  test("names the latest release, its date and the changes waiting after it", () => {
    const git = fakeGit({
      "describe --tags --abbrev=0 --match v[0-9]*": "v0.5.0\n",
      "log -1 --format=%cs v0.5.0": "2026-10-01\n",
      "rev-list --count --no-merges v0.5.0..HEAD": "8\n",
    });

    expect(readReleaseSummary(git)).toEqual({ version: "v0.5.0", date: "2026-10-01", waiting: 8 });
  });

  test("reads nothing before the first release", () => {
    expect(readReleaseSummary(fakeGit({}))).toBeUndefined();
  });
});
