// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { readCinemaTokens } from "../../.storybook/cinema-tokens";

/**
 * Guards the `docs-portal` capability's repository contracts: a Starlight
 * portal installed apart from the app, assembled with Storybook and TypeDoc
 * into one site, validated on pull requests and deployed from `develop`.
 */

const ROOT = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

type PackageJson = {
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const rootPackage = JSON.parse(read("package.json")) as PackageJson;

describe("the root package.json", () => {
  test.each(["astro", "@astrojs/starlight"])("does not install %s with the app", (name) => {
    const appDependencies = { ...rootPackage.dependencies, ...rootPackage.devDependencies };

    expect(appDependencies).not.toHaveProperty(name);
  });

  test("installs the portal as its own workspace root", () => {
    expect(rootPackage.scripts["portal:install"]).toBe("pnpm install --dir docs-portal");
    expect(read("docs-portal/pnpm-workspace.yaml")).toMatch(/^allowBuilds:/m);
  });

  test("assembles the site: the portal first, then Storybook and TypeDoc into it", () => {
    const steps = rootPackage.scripts["portal:build"].split(" && ");

    expect(steps).toEqual([
      "pnpm --dir docs-portal run build",
      "storybook build -o docs-portal/dist/storybook",
      "pnpm run docs --out docs-portal/dist/api",
    ]);
  });

  test.each(["dev", "preview"])("runs the portal's Astro %s", (command) => {
    expect(rootPackage.scripts[`portal:${command}`]).toBe(`pnpm --dir docs-portal run ${command}`);
  });
});

describe("the portal's Astro config", () => {
  const astroConfig = read("docs-portal/astro.config.mjs");

  test("serves the site from the root of its custom domain", () => {
    expect(astroConfig).toMatch(/site:\s*"https:\/\/docs\.english-course\.online"/);
    expect(astroConfig).not.toMatch(/\bbase:/);
  });

  test.each(["/storybook/", "/api/"])("links %s from the sidebar", (reference) => {
    expect(astroConfig).toContain(`link: "${reference}"`);
  });

  test.each(["ThemeProvider", "ThemeSelect", "SiteTitle"])(
    "replaces Starlight's %s with the portal's own",
    (component) => {
      expect(astroConfig).toContain(`${component}: "./src/components/${component}.astro"`);
    },
  );
});

describe("the docs-portal workflow", () => {
  const workflow = read(".github/workflows/docs-portal.yml");
  const deployJob = workflow.slice(workflow.indexOf("\n  deploy:"));

  test("runs on every pull request and on every push to develop", () => {
    expect(workflow).toMatch(/^on:\n {2}pull_request:\n {2}push:\n {4}branches: \[develop\]$/m);
  });

  test("builds the whole site and checks each part landed", () => {
    expect(workflow).toContain("run: pnpm portal:build");
    expect(workflow).toContain(
      "test -f docs-portal/dist/index.html -a -f docs-portal/dist/storybook/index.html -a -f docs-portal/dist/api/index.html",
    );
  });

  test("uploads the assembled site, and only for a push", () => {
    expect(workflow).toMatch(
      /uses: actions\/upload-pages-artifact@v\d+\n\s+if: github\.event_name == 'push'\n\s+with:\n\s+path: docs-portal\/dist/,
    );
  });

  test("deploys only on a push to develop, through the github-pages environment", () => {
    expect(deployJob).toContain(
      "if: github.event_name == 'push' && github.ref == 'refs/heads/develop'",
    );
    expect(deployJob).toContain("name: github-pages");
    expect(deployJob).toMatch(/uses: actions\/deploy-pages@v\d+/);
  });

  test("never cancels a deployment in progress", () => {
    expect(deployJob).toMatch(/concurrency:\n\s+group: pages\n\s+cancel-in-progress: false/);
  });
});

describe("the portal's site title", () => {
  test("reads ENGLISH·COURSE with a gold dot, tagged DOCS", () => {
    const siteTitle = read("docs-portal/src/components/SiteTitle.astro");

    expect(siteTitle).toMatch(/ENGLISH<span class="wordmark-dot">·<\/span>COURSE/);
    expect(siteTitle).toMatch(/<span class="docs-tag">DOCS<\/span>/);
  });
});

/** Which cinema-dark token in `globals.css` each Starlight colour takes its value from. */
const PORTAL_COLOR_TOKENS = {
  "sl-color-bg": "background",
  "sl-color-black": "background",
  "sl-color-bg-nav": "sidebar",
  "sl-color-bg-sidebar": "sidebar",
  "sl-color-white": "foreground",
  "sl-color-text": "foreground",
  "sl-color-gray-1": "foreground",
  "sl-color-gray-2": "foreground",
  "sl-color-gray-3": "muted-foreground",
  "sl-color-gray-5": "border",
  "sl-color-gray-6": "card",
  "sl-color-hairline": "border",
  "sl-color-hairline-light": "border",
  "sl-color-bg-inline-code": "card",
  "sl-color-accent": "gold",
  "sl-color-accent-high": "amber",
  "sl-color-text-accent": "gold",
  "sl-color-text-invert": "primary-foreground",
} as const;

const CUSTOM_PROPERTY = /--([\w-]+)\s*:\s*([^;]+);/g;

describe("the portal's cinema palette", () => {
  const darkTokens = new Map(readCinemaTokens(read("src/app/globals.css"), "dark"));
  const portalColors = new Map(
    [...read("docs-portal/src/styles/cinema.css").matchAll(CUSTOM_PROPERTY)].map(
      ([, name, value]) => [name, value.trim()],
    ),
  );

  test.each(Object.entries(PORTAL_COLOR_TOKENS))(
    "--%s takes the app's dark --%s",
    (portalProperty, tokenName) => {
      expect(darkTokens.has(tokenName)).toBe(true);
      expect(portalColors.get(portalProperty)).toBe(darkTokens.get(tokenName));
    },
  );
});
