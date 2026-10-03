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
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  test("assembles the site: the generated pages, the portal, then Storybook and TypeDoc into it", () => {
    const steps = rootPackage.scripts["portal:build"].split(" && ");

    expect(steps).toEqual([
      "pnpm portal:emails",
      "pnpm portal:changelog",
      "pnpm portal:architecture",
      "pnpm --dir docs-portal run build",
      "storybook build -o docs-portal/dist/storybook",
      "pnpm run docs --out docs-portal/dist/api",
      "pnpm portal:story-assets",
    ]);
  });

  test("mirrors the story media folders to the site root with its script", () => {
    expect(rootPackage.scripts["portal:story-assets"]).toBe(
      "tsx scripts/mirror-story-assets/mirror-story-assets.ts",
    );
  });

  test("renders the email gallery with its script", () => {
    expect(rootPackage.scripts["portal:emails"]).toBe("tsx scripts/email-gallery/email-gallery.ts");
  });

  test("writes the changelog page from history with git-cliff", () => {
    expect(rootPackage.scripts["portal:changelog"]).toBe(
      "git-cliff --output docs-portal/src/content/docs/changelog.md",
    );
  });

  test("draws the architecture graph with its script", () => {
    expect(rootPackage.scripts["portal:architecture"]).toBe(
      "tsx scripts/architecture-graph/architecture-graph.mts",
    );
  });

  test("generates its pages before starting the portal's dev server", () => {
    expect(rootPackage.scripts["portal:dev"]).toBe(
      "pnpm portal:emails && pnpm portal:changelog && pnpm portal:architecture && pnpm --dir docs-portal run dev",
    );
  });

  test("runs the portal's Astro preview", () => {
    expect(rootPackage.scripts["portal:preview"]).toBe("pnpm --dir docs-portal run preview");
  });
});

describe("the repository's ignores", () => {
  test.each([
    "/docs-portal/public/emails/",
    "/docs-portal/src/email-gallery.json",
    "/docs-portal/src/content/docs/changelog.md",
    "/docs-portal/public/architecture/",
  ])("keep the generated %s out of git", (generated) => {
    expect(read(".gitignore").split("\n")).toContain(generated);
  });
});

describe("the portal's Astro config", () => {
  const astroConfig = read("docs-portal/astro.config.mjs");

  test("serves the site from the root of its custom domain", () => {
    expect(astroConfig).toMatch(/site:\s*"https:\/\/docs\.english-course\.online"/);
    expect(astroConfig).not.toMatch(/\bbase:/);
  });

  test("takes its sidebar from navigation.mjs", () => {
    expect(astroConfig).toMatch(/import \{ SIDEBAR \} from "\.\/src\/navigation\.mjs";/);
    expect(astroConfig).toMatch(/sidebar: SIDEBAR,/);
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
  const ON_DEVELOP_OUTSIDE_PULL_REQUESTS =
    "github.ref == 'refs/heads/develop' && github.event_name != 'pull_request'";

  test("runs on every pull request, every push to develop, and when a release dispatches it", () => {
    expect(workflow).toMatch(
      /^on:\n {2}pull_request:\n {2}push:\n {4}branches: \[develop\]\n {2}workflow_dispatch:$/m,
    );
  });

  test("reads the whole history, so the changelog sees every tag", () => {
    expect(workflow).toMatch(/uses: actions\/checkout@v\d+\n\s+with:\n\s+fetch-depth: 0/);
  });

  test("builds the whole site and checks each part landed", () => {
    expect(workflow).toContain("run: pnpm portal:build");
    expect(workflow).toContain(
      "test -f docs-portal/dist/index.html -a -f docs-portal/dist/storybook/index.html -a -f docs-portal/dist/api/index.html",
    );
  });

  test("uploads the assembled site only on develop, never for a pull request", () => {
    expect(workflow).toMatch(
      new RegExp(
        `uses: actions/upload-pages-artifact@v\\d+\\n\\s+if: ${escapeRegExp(ON_DEVELOP_OUTSIDE_PULL_REQUESTS)}\\n\\s+with:\\n\\s+path: docs-portal/dist`,
      ),
    );
  });

  test("deploys only on develop, never for a pull request, through the github-pages environment", () => {
    expect(deployJob).toContain(`if: ${ON_DEVELOP_OUTSIDE_PULL_REQUESTS}`);
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
