import nodePath from "node:path";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Architectural boundary for the domain (Cockburn hexágono).
 * Reference: openspec/specs/architecture-boundaries/spec.md.
 *
 * The closed set of imports permitted from `src/domain/**` is the contract.
 * Built-in `no-restricted-imports` has no allowlist mode in ESLint v9 flat
 * config, so the implementation approximates the closed set with a denylist
 * of every delivery-mechanism package. `eslint-plugin-boundaries` is
 * installed and available, but its `boundaries/dependencies` rule did not
 * fire reliably in this project's flat-config / TypeScript parser combo;
 * a future change can re-evaluate it. Adding a new dep to the closed set
 * requires updating both `eslint.config.mjs` AND this spec.
 */
const boundaryMessage =
  "src/domain/** does not depend on delivery mechanisms. " +
  "Imports are limited to zod, neverthrow, and ts-pattern. " +
  "Update openspec/specs/architecture-boundaries/spec.md before extending.";

const forbiddenImports = [
  "next",
  "next-intl",
  "next-safe-action",
  "next-themes",
  "zustand",
  "nuqs",
  "server-only",
  "@/i18n",
  "@/adapters",
  "@/components",
  "@/app",
];

/**
 * Local rule enforcing AGENTS.md "Conventions → Folder structure".
 * Every entry file under these watched hexagonal roots must live in a
 * folder of the same name. Mirrors the AGENTS.md path table (ports,
 * entities, use cases, lib, hooks, adapters) — `src/components/**` is
 * excluded because that layer has its own PascalCase rule with
 * separately-named exceptions (`global-providers.tsx`, etc.).
 */
const FOLDER_STRUCTURE_WATCHED_ROOTS = [
  "src/domain",
  "src/domain/ports",
  "src/domain/entities",
  "src/domain/use-cases",
  "src/lib",
  "src/hooks",
  "src/adapters/persistence/in-memory",
];

const folderStructurePlugin = {
  meta: { name: "local-structure", version: "0.0.0" },
  rules: {
    "folder-per-entity": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Entry files in watched hexagonal layers must live in a folder with the same name. See AGENTS.md → Conventions → Folder structure.",
        },
        schema: [],
        messages: {
          mustBeInFolder:
            "Flat entry file under a watched hexagonal root. Move it into a folder with the same name (e.g. src/lib/<name>/<name>.ts). See AGENTS.md → Conventions → Folder structure.",
        },
      },
      create(context) {
        return {
          Program() {
            const filename = context.filename;
            if (!filename) return;
            // Only fire for .ts/.tsx source files. Declaration files
            // (.d.ts) are types, not entries, and are skipped.
            if (!/\.(tsx?)$/.test(filename) || filename.endsWith(".d.ts")) return;
            const rel = nodePath.relative(process.cwd(), filename).split(nodePath.sep).join("/");
            if (!rel.startsWith("src/")) return;
            for (const root of FOLDER_STRUCTURE_WATCHED_ROOTS) {
              const prefix = root + "/";
              if (!rel.startsWith(prefix)) continue;
              const remainder = rel.slice(prefix.length);
              const segments = remainder.split("/");
              // Only direct children of the watched root are violations.
              // Files already inside a subfolder pass through.
              if (segments.length !== 1) continue;
              const file = segments[0];
              // Barrel files at the root are allowed; `.d.ts` already
              // excluded above.
              if (file === "index.ts" || file === "index.tsx") continue;
              context.report({
                node: context.sourceCode.ast,
                messageId: "mustBeInFolder",
              });
              return;
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Run Prettier as an ESLint rule (reports formatting issues).
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "warn",
    },
  },
  // Must be last: turns off ESLint rules that conflict with Prettier.
  prettier,
  // Local folder-per-entity enforcement (see plugin definition above).
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: { "local-structure": folderStructurePlugin },
    rules: {
      "local-structure/folder-per-entity": "error",
    },
  },
  // Architectural boundary for the domain.
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...forbiddenImports.map((name) => ({
              name,
              message: boundaryMessage,
            })),
            ...forbiddenImports
              .filter((name) => !name.endsWith("/*"))
              .map((name) => ({
                name: `${name}/*`,
                message: boundaryMessage,
              })),
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Use the Clock port (deps.clock.now()) instead of new Date() in domain code.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "Use the Clock port (deps.clock.now()) instead of Date.now() in domain code.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='UTC']",
          message:
            "Introduce or receive a Calendar/Date port rather than using Date.UTC() directly in domain code.",
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: "Use an RNG port (deps.rng.next()) instead of Math.random() in domain code.",
        },
        {
          selector: "CallExpression[callee.object.name='crypto'][callee.property.name]",
          message:
            "Use an IdGenerator port (deps.ids.next()) or a domain-meaningful Hasher port instead of crypto.* in domain code.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // skills.sh — installed skills are managed by the CLI, not the repo
    ".agents/skills/**",
    // agent/tooling config dirs — not part of the app source
    ".claude/**",
    ".opencode/**",
    ".codex/**",
    "openspec/**",
    // typedoc — generated static site, never linted
    "docs/**",
  ]),
]);

export default eslintConfig;
