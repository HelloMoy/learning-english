/**
 * What the portal home's release strip says, read from git when the portal is
 * built. Plain JavaScript with no imports, so the repository's tests can run
 * it with a stand-in for git.
 */

/**
 * @typedef {object} ReleaseSummary
 * @property {string} version - The latest version tag, e.g. `v0.5.0`
 * @property {string} date - Its tagged commit's date, `YYYY-MM-DD`
 * @property {number} waiting - Non-merge commits after it: changes not yet released
 */

/**
 * Reads the latest release and how much has landed after it.
 *
 * @param {(...args: string[]) => string} git - Runs git with these arguments
 *   and returns its output, throwing when git fails
 * @returns {ReleaseSummary | undefined} Nothing before the first release, or
 *   when git cannot answer
 */
export function readReleaseSummary(git) {
  try {
    const version = git("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*").trim();
    const date = git("log", "-1", "--format=%cs", version).trim();
    const waiting = Number(git("rev-list", "--count", "--no-merges", `${version}..HEAD`).trim());
    return { version, date, waiting };
  } catch {
    return undefined;
  }
}
