#!/usr/bin/env bash
# TDD reminder hook (warn-only).
# Fires on PostToolUse for Edit/Write/MultiEdit. If the user edits a source file under
# src/ that has no colocated test, emit a reminder. NEVER blocks (exit 0).
#
# Wired in .claude/settings.json under hooks.PostToolUse.

set -euo pipefail

# Read the PostToolUse JSON payload from stdin.
payload="$(cat)"

file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // empty')"

# Only inspect edits that have a file path we care about.
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Resolve to a path relative to the repo root (file_path may be absolute).
repo_root="$(printf '%s' "$payload" | jq -r '.cwd // empty')"
if [[ -z "$repo_root" || ! -d "$repo_root" ]]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

# Make path relative if absolute.
case "$file_path" in
  "$repo_root"/*) rel="${file_path#$repo_root/}" ;;
  /*)             rel="${file_path#/}" ;;
  *)              rel="$file_path" ;;
esac

# Skip everything outside src/.
case "$rel" in
  src/*) ;;
  *) exit 0 ;;
esac

# Skip files that are themselves tests or test infra.
case "$rel" in
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) exit 0 ;;
  src/__tests__/*)                            exit 0 ;;
  src/**/*.test.*|src/**/*.spec.*)            exit 0 ;;
esac

# Skip file types that are not part of the TDD contract.
case "$rel" in
  *.css|*.scss|*.module.css)    exit 0 ;;  # styles
  *.d.ts)                       exit 0 ;;  # ambient / type-only declarations
  *.stories.tsx|*.story.tsx)    exit 0 ;;  # Storybook stories
  src/messages/*)               exit 0 ;;  # i18n message catalogs
  src/types/*|src/*.types.ts)    exit 0 ;;  # shared type modules
  src/i18n/*)                   exit 0 ;;  # i18n config
  src/middleware.ts)            exit 0 ;;  # Next.js middleware
  *.config.ts|*.config.tsx)     exit 0 ;;  # build/runtime configs
  next.config.*|tailwind.config.*|postcss.config.*|eslint.config.*) exit 0 ;;
  *.test-helpers.ts|*.test-utils.ts) exit 0 ;;
esac

# Build the expected colocated test path and check existence.
abs_path="$repo_root/$rel"
dir="$(dirname "$abs_path")"
base="$(basename "$abs_path")"
ext="${base##*.}"
stem="${base%.*}"

skip_ext_check=0
case "$ext" in
  ts|tsx|js|jsx) ;;
  *) skip_ext_check=1 ;;
esac

if [[ "$skip_ext_check" -eq 0 ]]; then
  for cand in \
    "$dir/$stem.test.ts"  \
    "$dir/$stem.test.tsx" \
    "$dir/$stem.spec.ts"  \
    "$dir/$stem.spec.tsx" \
    "$dir/__tests__/$stem.test.ts"  \
    "$dir/__tests__/$stem.test.tsx"; do
    if [[ -f "$cand" ]]; then
      exit 0
    fi
  done

  echo "⚠️  TDD reminder ($tool_name): edited $rel but no colocated test was found." >&2
  echo "    Expected one of:" >&2
  echo "      - $dir/$stem.test.ts" >&2
  echo "      - $dir/$stem.test.tsx" >&2
  echo "    Write a failing test first (Red → Green → Refactor)." >&2
fi

exit 0