// commitlint config.
//
// This file is the mechanical enforcement of COMMIT_CONVENTIONS.md. The
// human-readable rules live there; this file makes sure no commit sneaks
// past them.
//
// Hooked via `.husky/commit-msg`, which runs `commitlint --edit` on the
// staged commit message before the commit lands.
//
// Note on custom rules vs default rules: commitlint's default `subject-case`
// rule reads `parsed.subject`, which (with the default
// conventional-changelog-conventionalcommits parser) captures
// ":sparkles: <summary>" — i.e. the leading colon is part of the subject
// string. That makes lowercase enforcement unreliable. We bypass the
// default and parse the header ourselves in `subject-must-be-lowercase`.

const ALLOWED_TYPES = [
  "feat",
  "fix",
  "docs",
  "refactor",
  "perf",
  "test",
  "style",
  "build",
  "ci",
  "chore",
];

// Gitmoji codes officially supported by the project. See
// COMMIT_CONVENTIONS.md → Allowed gitmojis for the full list and
// descriptions.
const ALLOWED_GITMOJIS = [
  "sparkles",
  "bug",
  "wrench",
  "memo",
  "white_check_mark",
  "fire",
  "art",
  "lipstick",
  "recycle",
  "truck",
  "heavy_plus_sign",
  "heavy_minus_sign",
  "arrow_up",
  "arrow_down",
  "rotating_light",
  "wheelchair",
  "mute",
];

/**
 * Parse the commit header (first line) into structured parts.
 * Format: `<type>(<scope>): :<gitmoji>: <summary>`
 *
 * Returns `{ type, scope, gitmoji, summary }` or `null` if the header
 * doesn't match the expected shape (the regex would fail on those before
 * `subject-case` runs anyway, so we can be strict).
 */
function parseHeader(header) {
  if (typeof header !== "string") return null;
  const match = header.match(
    /^(feat|fix|docs|refactor|perf|test|style|build|ci|chore)(?:\(([^)]+)\))?:\s:([a-z_]+):\s(.+)$/,
  );
  if (!match) return null;
  const [, type, scope, gitmoji, summary] = match;
  return { type, scope, gitmoji, summary };
}

/**
 * Custom rule: header must include a known gitmoji code between `(scope)`
 * and the summary, e.g. `feat(auth): :sparkles: add login`.
 */
function gitmojiRequired({ header }) {
  if (!header) return [false, "header is empty"];
  const parsed = parseHeader(header);
  if (!parsed) {
    return [
      false,
      "header must follow `<type>(<scope>): :<gitmoji>: <summary>` — see COMMIT_CONVENTIONS.md",
    ];
  }
  if (!ALLOWED_GITMOJIS.includes(parsed.gitmoji)) {
    return [
      false,
      `unknown gitmoji :${parsed.gitmoji}: — see COMMIT_CONVENTIONS.md for the allowed list`,
    ];
  }
  return [true];
}

/**
 * Custom rule: `test` commits MUST use `:white_check_mark:` per the
 * "Test commit discipline" section of COMMIT_CONVENTIONS.md.
 */
function testCommitsUseCheck({ header }) {
  const parsed = parseHeader(header);
  if (!parsed || parsed.type !== "test") return [true];
  if (parsed.gitmoji !== "white_check_mark") {
    return [false, "test commits MUST use `:white_check_mark:` — see COMMIT_CONVENTIONS.md"];
  }
  return [true];
}

/**
 * Custom rule: summary (text after the gitmoji) must start with a
 * lowercase letter. Uses our own parser to bypass the default-rule quirk
 * with the leading colon.
 */
function summaryMustBeLowercase({ header }) {
  const parsed = parseHeader(header);
  if (!parsed) return [true]; // other rules handle malformed headers
  const firstChar = parsed.summary.charAt(0);
  if (firstChar !== firstChar.toLowerCase() || /[A-Z]/.test(firstChar)) {
    return [false, "summary must start with a lowercase letter (imperative mood)"];
  }
  return [true];
}

/**
 * Custom rule: summary must not end with a period. Trims trailing
 * whitespace first to avoid false positives.
 */
function summaryMustNotEndWithPeriod({ header }) {
  const parsed = parseHeader(header);
  if (!parsed) return [true];
  const trimmed = parsed.summary.replace(/\s+$/, "");
  if (trimmed.endsWith(".")) {
    return [false, "summary must not end with a period"];
  }
  return [true];
}

module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "gitmoji-required": gitmojiRequired,
        "test-commits-use-check": testCommitsUseCheck,
        "summary-must-be-lowercase": summaryMustBeLowercase,
        "summary-must-not-end-with-period": summaryMustNotEndWithPeriod,
      },
    },
  ],
  rules: {
    // Type enum: lock the 10 conventional types — no "feature" or "feat:" typos.
    "type-enum": [2, "always", ALLOWED_TYPES],
    // Header max: ≤ 90 chars per COMMIT_CONVENTIONS.md.
    "header-max-length": [2, "always", 90],
    // Custom rules wired above.
    "gitmoji-required": [2, "always"],
    "test-commits-use-check": [2, "always"],
    "summary-must-be-lowercase": [2, "always"],
    "summary-must-not-end-with-period": [2, "always"],
    // Disable default rules that we replace with custom versions above,
    // or that fight our gitmoji-style format.
    "subject-case": [0], // replaced by summary-must-be-lowercase
    "subject-full-stop": [0], // replaced by summary-must-not-end-with-period
    "scope-empty": [0], // scope recommended but not required
    "body-leading-blank": [0],
    "footer-leading-blank": [0],
  },
};
