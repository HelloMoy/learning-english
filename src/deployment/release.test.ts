// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

/**
 * Guards the `release-versioning` workflow's contract: every push to `main`
 * versions, tags and publishes the released `develop` commit, then redeploys
 * the docs portal.
 */

const ROOT = path.resolve(__dirname, "../..");
const workflow = readFileSync(path.join(ROOT, ".github/workflows/release.yml"), "utf8");

describe("the release workflow", () => {
  test("runs on every push to main, one release at a time", () => {
    expect(workflow).toMatch(/^on:\n {2}push:\n {4}branches: \[main\]$/m);
    expect(workflow).toMatch(/concurrency:\n\s+group: release\n\s+cancel-in-progress: false/);
  });

  test("may push tags, publish releases and dispatch workflows, and nothing else", () => {
    expect(workflow).toMatch(/permissions:\n\s+contents: write\n\s+actions: write\n/);
  });

  test("reads the whole history, so git-cliff sees every tag", () => {
    expect(workflow).toContain("fetch-depth: 0");
  });

  test("tags the released develop commit: a merge's second parent, else the commit itself", () => {
    expect(workflow).toContain(
      'released="$(git rev-parse HEAD^2 2>/dev/null || git rev-parse HEAD)"',
    );
  });

  test("computes the version with git-cliff, without pnpm's output in the way", () => {
    expect(workflow).toContain('version="$(node_modules/.bin/git-cliff --bumped-version)"');
  });

  test("releases nothing when the commit is already tagged or nothing new arrived", () => {
    expect(workflow).toContain("git tag --points-at \"$released\" --list 'v[0-9]*'");
    expect(workflow).toContain('[ "$version" = "$(git describe --tags --abbrev=0)" ]');
  });

  test("pushes the tag, publishes the release and redeploys the docs portal", () => {
    expect(workflow).toContain('git tag "$version" "$released"');
    expect(workflow).toContain('git push origin "$version"');
    expect(workflow).toContain('gh release create "$version"');
    expect(workflow).toContain("gh workflow run docs-portal.yml --ref develop");
  });
});
