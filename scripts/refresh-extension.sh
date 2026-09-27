#!/bin/sh
# Rebuild dist/ after a branch checkout, merge, or rewrite.
# Usage: refresh-extension.sh <reason> <previous-rev> <new-rev>
# Always exits 0. Install and build failures print a [Polaris] warning.

if [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]; then
  exit 0
fi

reason=${1:-git}
prev=${2:-}
newrev=${3:-HEAD}

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

warn() {
  printf '%s\n' "[Polaris] $1" >&2
}

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
    return $?
  fi
  if command -v corepack >/dev/null 2>&1; then
    corepack pnpm "$@"
    return $?
  fi
  return 127
}

if ! command -v pnpm >/dev/null 2>&1 && ! command -v corepack >/dev/null 2>&1; then
  warn "pnpm was not found on PATH after ${reason}, so dist/ was not rebuilt. Install pnpm, then run pnpm install."
  exit 0
fi

lockfile_changed() {
  old=$1
  next=$2
  if [ -z "$old" ] || [ "$old" = "0000000000000000000000000000000000000000" ]; then
    return 0
  fi
  if git diff --quiet "$old" "$next" -- pnpm-lock.yaml; then
    return 1
  fi
  return 0
}

if lockfile_changed "$prev" "$newrev"; then
  if ! run_pnpm install --frozen-lockfile; then
    warn "pnpm install failed after ${reason}. dist/ may be stale. Run pnpm install."
  fi
fi

if ! run_pnpm build; then
  warn "pnpm build failed after ${reason}. dist/ may be stale. Run pnpm build, then click refresh in chrome://extensions."
fi

exit 0
