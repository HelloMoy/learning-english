// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

/**
 * Guards `cliff.toml` — the `release-versioning` bump rules and the
 * `portal-changelog` entries — by running git-cliff against a throwaway
 * repository, so the result never depends on this repository's own tags.
 */

const ROOT = path.resolve(__dirname, "../..");
const GIT_CLIFF = path.join(ROOT, "node_modules/.bin/git-cliff");

type HistoryStep = { commit: string } | { tag: string };

function repositoryWith(history: HistoryStep[]): string {
  const repository = mkdtempSync(path.join(tmpdir(), "cliff-"));
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
      cwd: repository,
    });

  git("init", "--quiet", "--initial-branch=develop");
  for (const step of history) {
    if ("commit" in step) git("commit", "--quiet", "--allow-empty", "--message", step.commit);
    else git("tag", step.tag);
  }
  return repository;
}

function gitCliff(repository: string, ...args: string[]): string {
  return execFileSync(
    GIT_CLIFF,
    ["--config", path.join(ROOT, "cliff.toml"), "--repository", repository, ...args],
    { encoding: "utf8" },
  ).trim();
}

const released: HistoryStep[] = [
  { commit: "feat(catalog): :sparkles: list the courses" },
  { tag: "v0.5.0" },
];

describe("the bump rules", () => {
  test("a release of fixes only bumps the patch", () => {
    const repository = repositoryWith([
      ...released,
      { commit: "fix(player): :bug: resume where the learner stopped" },
      { commit: "refactor(player): :recycle: name the resume rule" },
    ]);

    expect(gitCliff(repository, "--bumped-version")).toBe("v0.5.1");
  });

  test("a release with a feature bumps the minor", () => {
    const repository = repositoryWith([
      ...released,
      { commit: "fix(player): :bug: resume where the learner stopped" },
      { commit: "feat(profile): :sparkles: choose an avatar" },
    ]);

    expect(gitCliff(repository, "--bumped-version")).toBe("v0.6.0");
  });

  test("a breaking change bumps the minor while in 0.x", () => {
    const repository = repositoryWith([
      ...released,
      { commit: "feat(auth)!: :boom: require a verified email" },
    ]);

    expect(gitCliff(repository, "--bumped-version")).toBe("v0.6.0");
  });

  test("with nothing new, the bumped version is the latest tag", () => {
    expect(gitCliff(repositoryWith(released), "--bumped-version")).toBe("v0.5.0");
  });
});

describe("the changelog", () => {
  const repository = repositoryWith([
    { commit: "feat(catalog): :sparkles: list the courses" },
    { commit: "Merge pull request #1 from HelloMoy/feat/catalog" },
    { commit: "docs(openspec): :memo: archive the catalog change" },
    { tag: "v0.1.0" },
    { commit: "fix(player): :bug: resume where the learner stopped" },
    { commit: "feat(profile): :sparkles: choose an avatar" },
  ]);
  const changelog = gitCliff(repository);

  test("opens with the portal page's front matter", () => {
    expect(changelog).toMatch(/^---\ntitle: Changelog\n/);
  });

  test("lists unreleased work before the released versions", () => {
    expect(changelog.indexOf("## Unreleased")).toBeGreaterThan(-1);
    expect(changelog.indexOf("## Unreleased")).toBeLessThan(changelog.indexOf("## v0.1.0"));
  });

  test("reads each entry as its scope in bold and its summary, without the gitmoji", () => {
    expect(changelog).toContain("- **profile:** choose an avatar");
    expect(changelog).not.toMatch(/:sparkles:|:bug:/);
  });

  test("links each entry's short hash to its commit", () => {
    expect(changelog).toMatch(
      /\(\[[0-9a-f]{7}\]\(https:\/\/github\.com\/HelloMoy\/learning-english\/commit\/[0-9a-f]{40}\)\)/,
    );
  });

  test("groups features before fixes", () => {
    const unreleased = changelog.slice(0, changelog.indexOf("## v0.1.0"));

    expect(unreleased.indexOf("### Features")).toBeLessThan(unreleased.indexOf("### Fixes"));
  });

  test("leaves out pull-request merges and OpenSpec bookkeeping", () => {
    expect(changelog).not.toContain("Merge pull request");
    expect(changelog).not.toContain("archive the catalog change");
  });

  test("keeps the front matter out of release notes", () => {
    expect(gitCliff(repository, "--latest", "--strip", "header")).not.toContain("title: Changelog");
  });
});
