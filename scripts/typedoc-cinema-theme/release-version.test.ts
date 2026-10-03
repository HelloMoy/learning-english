import { describe, expect, test } from "vitest";

import { applyReleaseVersion, releaseVersionFrom } from "./release-version.mts";

/**
 * Guards the `api-reference-theme` version badge: it names the release git
 * reports, in the form the badge prefixes with `v`.
 */
describe("releaseVersionFrom", () => {
  test("reads a checkout sitting on a release tag", () => {
    expect(releaseVersionFrom("v0.5.0\n")).toBe("0.5.0");
  });

  test("reads a checkout ahead of the latest release", () => {
    expect(releaseVersionFrom("v0.5.0-12-gabc1234\n")).toBe("0.5.0-12-gabc1234");
  });

  test("reads nothing when git reports no tag", () => {
    expect(releaseVersionFrom("")).toBeUndefined();
  });
});

describe("applyReleaseVersion", () => {
  test("names the project after the release git reports", () => {
    const project = { packageVersion: "0.1.0" };

    applyReleaseVersion(project, () => "v0.5.0-3-gdeadbee");

    expect(project.packageVersion).toBe("0.5.0-3-gdeadbee");
  });

  test("keeps the package version when git has no release to report", () => {
    const project = { packageVersion: "0.1.0" };

    applyReleaseVersion(project, () => "");

    expect(project.packageVersion).toBe("0.1.0");
  });
});
