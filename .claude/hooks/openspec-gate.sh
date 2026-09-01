#!/usr/bin/env bash
# OpenSpec gate (blocking).
#
# Fires on PreToolUse for Edit/Write/MultiEdit/Bash. Refuses any write to a file
# under src/, scripts/ or e2e/ while openspec/changes/ holds no active change,
# per the non-negotiable workflow in AGENTS.md ("Spec first").
#
# Exit 2 = block the tool call and show stderr to the model. Exit 0 = allow.
#
# Bash is matched too: an edit made with sed/heredoc/tee is still an edit, and
# routing around Edit/Write is how the previous PostToolUse reminder was missed.
#
# Wired in .claude/settings.json under hooks.PreToolUse.

set -euo pipefail

payload="$(cat)"

# A payload jq cannot parse means the hook contract changed under us. Allow the
# call rather than wedging the session: CLAUDE.md still carries the rule, and a
# gate that fails closed on its own bugs is worse than one that fails open.
if ! printf '%s' "$payload" | jq -e . >/dev/null 2>&1; then
  exit 0
fi

repo_root="$(printf '%s' "$payload" | jq -r '.cwd // empty')"
if [[ -z "$repo_root" || ! -d "$repo_root" ]]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

# An "active change" is any directory under openspec/changes/ other than the
# archive. While one exists the workflow has been entered and edits are allowed;
# the change's own tasks carry the TDD ordering from there.
has_active_change() {
  local changes_dir="$repo_root/openspec/changes"
  [[ -d "$changes_dir" ]] || return 1
  local entry
  for entry in "$changes_dir"/*/; do
    [[ -d "$entry" ]] || continue
    [[ "$(basename "$entry")" == "archive" ]] && continue
    return 0
  done
  return 1
}

if has_active_change; then
  exit 0
fi

# Which paths the workflow covers. Tests and specs are the *first* thing a task
# writes, so they must stay writable — otherwise the gate forbids the very step
# it exists to enforce.
is_guarded_path() {
  local path="$1"
  case "$path" in
    /*) path="${path#"$repo_root"/}" ;;
  esac
  case "$path" in
    src/*|scripts/*|e2e/*) ;;
    *) return 1 ;;
  esac
  case "$path" in
    *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) return 1 ;;
    *.stories.tsx|*.story.tsx) return 1 ;;
  esac
  return 0
}

refuse() {
  cat >&2 <<MESSAGE
BLOCKED — $1

AGENTS.md: no production code under src/, scripts/ or e2e/ without an active
OpenSpec change. openspec/changes/ currently holds nothing but the archive.

Start one first:  /opsx:propose "<what you are changing and why>"
Then implement through /opsx:apply, writing the failing test before the code.

If this really is exempt (throwaway prototype, generated code, pure config),
ask the user to confirm the exemption before editing.
MESSAGE
  exit 2
}

tool_name="$(printf '%s' "$payload" | jq -r '.tool_name // empty')"

if [[ "$tool_name" == "Bash" ]]; then
  command="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')"
  # Only inspect commands that can write. A grep or cat naming a src/ path is
  # reading, and blocking reads would make the gate unusable.
  if printf '%s' "$command" | grep -qE '(^|[|;&[:space:]])(sed[[:space:]]+-i|perl[[:space:]]+-[a-z]*i|tee|dd|truncate|install|patch|python3?|node|npx[[:space:]]+tsx|tsx)([[:space:]]|$)|>[[:space:]]*[^|&>]*(src|scripts|e2e)/|(^|[[:space:]])(cp|mv|rm)[[:space:]]'; then
    for candidate in $(printf '%s' "$command" | grep -oE '(^|[[:space:]"'"'"'>])((\./)?(src|scripts|e2e)/[A-Za-z0-9._/-]+)' | grep -oE '(src|scripts|e2e)/[A-Za-z0-9._/-]+'); do
      if is_guarded_path "$candidate"; then
        refuse "Bash command writes $candidate"
      fi
    done
  fi
  exit 0
fi

file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.path // empty')"
[[ -n "$file_path" ]] || exit 0

if is_guarded_path "$file_path"; then
  refuse "$tool_name writes ${file_path#"$repo_root"/}"
fi

exit 0
