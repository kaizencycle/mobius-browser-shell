#!/usr/bin/env bash
# mobius-browser-shell — Vercel ignoreCommand (C-323 INFRA-06)
# Exit 0 = skip build, exit 1 = build.
set -euo pipefail

COMMIT_MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
AUTHOR="${VERCEL_GIT_COMMIT_AUTHOR_LOGIN:-unknown}"

if [[ -z "$COMMIT_MSG" ]]; then
  COMMIT_MSG="$(git log -1 --format=%s 2>/dev/null || echo "")"
fi

# Human operator commits always build
if [[ "$AUTHOR" == "kaizencycle" ]]; then
  echo "✅ Human commit — building"
  exit 1
fi

# Explicit deploy flag on any author
if echo "$COMMIT_MSG" | grep -qE '\[deploy\]'; then
  echo "✅ [deploy] flag — building"
  exit 1
fi

# Skip [skip ci] / mesh sync bot churn
if echo "$COMMIT_MSG" | grep -qE '\[skip ci\]|\[skip deploy\]'; then
  echo "⏭ Skipping build: skip directive in commit message"
  exit 0
fi

if [[ "$COMMIT_MSG" =~ ^chore\(mesh\): ]]; then
  echo "⏭ Skipping build: mesh sync commit"
  exit 0
fi

# Bot authors without [deploy]
if [[ "$AUTHOR" == "mobius-bot" ]] \
  || [[ "$AUTHOR" == "github-actions[bot]" ]] \
  || [[ "$AUTHOR" == "cursoragent" ]]; then
  echo "⏭ Skipping build: bot commit without [deploy] flag ($AUTHOR)"
  exit 0
fi

echo "✅ Building: $COMMIT_MSG"
exit 1
