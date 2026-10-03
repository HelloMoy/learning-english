import { execFileSync } from "node:child_process";

/** The part of a TypeDoc project the version badge reads. */
type VersionedProject = { packageVersion?: string };

/**
 * Names the documented project after the release git reports, so the API
 * reference's badge shows `v0.5.0-12-gabc1234` rather than the
 * `package.json` version, which releases never change.
 *
 * @param project - The TypeDoc project, at the end of conversion
 * @param describe - Returns `git describe --tags` output, or `""` without one
 */
export function applyReleaseVersion(
  project: VersionedProject,
  describe: () => string = describeReleaseTag,
): void {
  project.packageVersion = releaseVersionFrom(describe()) ?? project.packageVersion;
}

/**
 * Reads a release version from `git describe --tags` output.
 *
 * @param describeOutput - What `git describe --tags` printed, e.g.
 *   `v0.5.0` on a release or `v0.5.0-12-gabc1234` twelve commits after it
 * @returns The version without its leading `v` — the badge adds it — or
 *   nothing when git reported no tag
 */
export function releaseVersionFrom(describeOutput: string): string | undefined {
  const described = describeOutput.trim();
  return described ? described.replace(/^v/, "") : undefined;
}

function describeReleaseTag(): string {
  try {
    return execFileSync("git", ["describe", "--tags", "--match", "v[0-9]*"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // No git, no history (a shallow clone) or no release tag yet: the badge
    // keeps the package version.
    return "";
  }
}
