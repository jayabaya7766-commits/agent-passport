#!/usr/bin/env bash
# Publishes site/ to the gh-pages branch (the GitHub Pages source).
# Run from the repo root after editing anything under site/:
#   ./scripts/publish-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="gh-pages"
WORKTREE="$(mktemp -d)"
trap 'rm -rf "$WORKTREE"; git worktree prune' EXIT

git worktree add --detach "$WORKTREE" >/dev/null 2>&1
cd "$WORKTREE"
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout --orphan "$BRANCH"
fi
git rm -rf . >/dev/null 2>&1 || true
cp -r "$OLDPWD/site/." .
git add -A
if git diff --cached --quiet; then
  echo "gh-pages is already up to date."
else
  git -c user.name="jayabaya7766-commits" -c user.email="jayabaya7766@gmail.com" \
    commit -m "Publish site $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git push origin "$BRANCH"
  echo "Published to gh-pages. Pages URL: https://jayabaya7766-commits.github.io/agent-passport/"
fi
