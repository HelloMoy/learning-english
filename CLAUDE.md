# CLAUDE.md

## Read this first

**Every rule in `AGENTS.md` applies.** It is imported below and is the source of
truth — this file only restates the parts that were being missed.

## Non-negotiable, before you touch anything

1. **OpenSpec before code.** An active change must exist in `openspec/changes/`
   before any edit under `src/`, `scripts/` or `e2e/`. Start one with
   `/opsx:propose "<idea>"`. A `PreToolUse` hook blocks those edits otherwise —
   including edits made through `Bash` (`sed`, heredocs, scripts), which are not
   an escape hatch from this rule.
2. **Failing test before production code.** Red → Green → Refactor, every task.
   If you wrote the code first, delete it and start over.
3. **`clean-code` skill on every change** — features, fixes, refactors, tests,
   stories, scripts.
4. **Ask before skipping the flow.** The "cosmetic fix" exception is void the
   moment a file under `src/`, `scripts/` or `e2e/` changes.

## Then

- `/opsx:apply` to work the tasks, `/opsx:verify` and `/opsx:archive` to close.
- Verify UI work yourself in the browser with Playwright MCP; never hand a
  visual check back to the user.

@AGENTS.md
