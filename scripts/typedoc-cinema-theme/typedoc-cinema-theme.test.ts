import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { within } from "@testing-library/react";
import { Application, PackageJsonReader, TSConfigReader, TypeDocReader } from "typedoc";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { load } from "./typedoc-cinema-theme.mts";

const REPO_ROOT = path.resolve(__dirname, "../..");
const FIXTURE = path.join(__dirname, "fixture");
const RENDER_TIMEOUT_MS = 60_000;
const FUNCTION_PAGE = "functions/lib_format-duration_format-duration.formatDuration.html";

let outputDir: string;

/**
 * Renders the fixture with the repo's own `typedoc.json`, so the test breaks
 * when the config and the theme stop agreeing. Only what points TypeDoc at
 * `src/` is swapped for the fixture.
 */
async function renderFixture(): Promise<void> {
  const app = await Application.bootstrap(
    {
      options: path.join(REPO_ROOT, "typedoc.json"),
      entryPoints: [path.join(FIXTURE, "src")],
      tsconfig: path.join(FIXTURE, "tsconfig.json"),
      disableSources: true,
      logLevel: "Error",
    },
    [new TypeDocReader(), new PackageJsonReader(), new TSConfigReader()],
  );
  load(app);
  const project = await app.convert();
  if (!project) throw new Error("TypeDoc could not convert the fixture project");
  await app.generateDocs(project, outputDir);
}

function readPage(relativePath: string): Promise<string> {
  return readFile(path.join(outputDir, relativePath), "utf8");
}

async function openPage(relativePath: string): Promise<HTMLElement> {
  document.body.innerHTML = await readPage(relativePath);
  return document.body;
}

function toolbarOf(page: HTMLElement): HTMLElement {
  const toolbar = page.querySelector<HTMLElement>("header.tsd-page-toolbar");
  if (!toolbar) throw new Error("The page has no TypeDoc toolbar");
  return toolbar;
}

beforeAll(async () => {
  outputDir = await mkdtemp(path.join(tmpdir(), "cinema-typedoc-"));
  await renderFixture();
}, RENDER_TIMEOUT_MS);

afterAll(async () => {
  await rm(outputDir, { recursive: true, force: true });
});

describe("the cinema TypeDoc theme", () => {
  test("renders the reference home page", async () => {
    await expect(readPage("index.html")).resolves.toContain("<html");
  });

  test("renders a page for each documented function", async () => {
    await expect(readPage(FUNCTION_PAGE)).resolves.toContain("formatDuration");
  });

  test("opens on the cinema home page instead of the project's module list", async () => {
    const home = await readPage("index.html");

    expect(home).toContain("The <em>API reference</em> for English Course.");
    expect(home).not.toContain('class="tsd-page-title"');
  });

  test("summarises each module on the home page", async () => {
    await expect(readPage("index.html")).resolves.toContain(
      "Split a duration in seconds into hours and minutes for display.",
    );
  });

  test("links every module from the home page", async () => {
    await expect(readPage("index.html")).resolves.toContain(
      'href="modules/lib_format-duration_format-duration.html"',
    );
  });

  test("keeps TypeDoc's templates for declaration pages", async () => {
    await expect(readPage(FUNCTION_PAGE)).resolves.toContain('class="tsd-signature');
  });

  test("uses the app's icon as the favicon", async () => {
    const page = await openPage(FUNCTION_PAGE);

    expect(page.querySelector('link[rel="icon"]')?.getAttribute("href")).toMatch(
      /^\.\.\/assets\/favicon\.svg/,
    );
    await expect(readPage("assets/favicon.svg")).resolves.toContain("<svg");
  });

  test("busts the browser cache for the cinema stylesheet on every build", async () => {
    const page = await openPage(FUNCTION_PAGE);

    expect(page.querySelector('link[href*="custom.css"]')?.getAttribute("href")).toMatch(
      /custom\.css\?cache=\S+/,
    );
  });

  test("ships the cinema stylesheet", async () => {
    await expect(readPage("assets/custom.css")).resolves.toContain("Immersion Cinema");
  });

  describe("toolbar", () => {
    test("shows the ENGLISH·COURSE wordmark and API tag, linking home", async () => {
      const toolbar = toolbarOf(await openPage(FUNCTION_PAGE));

      expect(within(toolbar).getByRole("link", { name: "ENGLISH·COURSE API" })).toHaveAttribute(
        "href",
        "../index.html",
      );
    });

    test("sets the wordmark's middle dot apart so it can be gold", async () => {
      const toolbar = toolbarOf(await openPage(FUNCTION_PAGE));

      expect(toolbar.querySelector(".cinema-wordmark-dot")).toHaveTextContent("·");
    });

    test("keeps the controls TypeDoc's scripts bind to", async () => {
      const toolbar = toolbarOf(await openPage(FUNCTION_PAGE));

      for (const id of [
        "tsd-search-trigger",
        "tsd-search",
        "tsd-search-input",
        "tsd-toolbar-menu-trigger",
      ]) {
        expect(toolbar.querySelector(`#${id}`)).toBeInTheDocument();
      }
    });
  });

  describe("declaration header", () => {
    test("names the declaration alone in the page heading", async () => {
      const page = await openPage(FUNCTION_PAGE);

      expect(within(page).getByRole("heading", { level: 1 })).toHaveTextContent(/^formatDuration$/);
    });

    test("names the declaration's kind in an eyebrow above the heading", async () => {
      const page = await openPage(FUNCTION_PAGE);

      const heading = within(page).getByRole("heading", { level: 1 });
      expect(heading.previousElementSibling).toHaveTextContent(/^Function$/);
    });

    test("keeps the breadcrumb", async () => {
      const page = await openPage(FUNCTION_PAGE);

      expect(within(page).getByRole("list", { name: "Breadcrumb" })).toBeInTheDocument();
    });
  });

  describe("footer", () => {
    test("shows the wordmark and how to regenerate the reference", async () => {
      const footer = (await openPage(FUNCTION_PAGE)).querySelector("footer");

      expect(footer).toHaveTextContent("ENGLISH·COURSE");
      expect(footer).toHaveTextContent("pnpm run docs");
    });
  });
});
