#!/usr/bin/env bash
#
# Flowgram deploy
#
# Commits any pending work on the feature branch, brings master up to date with it,
# and pushes both branches to origin.
#
# Conflict safety: master is only ever advanced with `git merge --ff-only`. A
# fast-forward replays no changes, so a merge conflict is structurally impossible.
# If master has its own commits that the feature branch doesn't contain, the branches
# have diverged, --ff-only refuses, and this script aborts without touching anything.
#
set -euo pipefail

FEATURE_BRANCH="revision-darla"
TARGET_BRANCH="master"
REMOTE="origin"

cd "$(dirname "$0")/.."

info()  { printf '\033[0;34m▸\033[0m %s\n' "$1"; }
ok()    { printf '\033[0;32m✓\033[0m %s\n' "$1"; }
warn()  { printf '\033[0;33m!\033[0m %s\n' "$1"; }
fail()  { printf '\033[0;31m✗\033[0m %s\n' "$1" >&2; exit 1; }

# ── 0. Preflight ─────────────────────────────────────────────────────────────
git rev-parse --git-dir >/dev/null 2>&1 || fail "Not a git repository."

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
restore_branch() {
  local current
  current="$(git rev-parse --abbrev-ref HEAD)"
  if [ "$current" != "$ORIGINAL_BRANCH" ]; then
    warn "Returning to $ORIGINAL_BRANCH"
    git checkout --quiet "$ORIGINAL_BRANCH" || true
  fi
}
trap restore_branch EXIT

if [ "$ORIGINAL_BRANCH" != "$FEATURE_BRANCH" ]; then
  fail "Expected to be on '$FEATURE_BRANCH' but you're on '$ORIGINAL_BRANCH'. Switch branches first."
fi

git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH" \
  || fail "Local branch '$TARGET_BRANCH' does not exist."

# Refuse to run mid-merge / mid-rebase / mid-cherry-pick
GIT_DIR="$(git rev-parse --git-dir)"
for state in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
  [ -e "$GIT_DIR/$state" ] && fail "Repository is mid-operation ($state). Resolve it first."
done

# ── 1. Commit pending work on the feature branch ─────────────────────────────
if [ -n "$(git status --porcelain)" ]; then
  info "Staging changes on $FEATURE_BRANCH"
  git status --short
  git add -A

  COMMIT_MSG="${DEPLOY_MSG:-chore: sync revisions $(date '+%Y-%m-%d %H:%M')}"
  git commit -m "$COMMIT_MSG"
  ok "Committed: $COMMIT_MSG"
else
  info "Working tree clean — nothing new to commit."
fi

# ── 2. Verify the fast-forward is possible BEFORE touching anything ──────────
info "Checking that $TARGET_BRANCH can fast-forward to $FEATURE_BRANCH"
if ! git merge-base --is-ancestor "$TARGET_BRANCH" "$FEATURE_BRANCH"; then
  AHEAD="$(git rev-list --count "$FEATURE_BRANCH..$TARGET_BRANCH")"
  fail "$TARGET_BRANCH has $AHEAD commit(s) not in $FEATURE_BRANCH — branches diverged.
      Aborting to avoid a conflicting merge. Reconcile manually, e.g.:
        git checkout $FEATURE_BRANCH && git merge $TARGET_BRANCH"
fi

BEHIND="$(git rev-list --count "$TARGET_BRANCH..$FEATURE_BRANCH")"
ok "Fast-forward is safe ($TARGET_BRANCH is $BEHIND commit(s) behind)."

# ── 3. Push the feature branch ───────────────────────────────────────────────
info "Pushing $FEATURE_BRANCH to $REMOTE"
git push --set-upstream "$REMOTE" "$FEATURE_BRANCH"
ok "$FEATURE_BRANCH pushed."

# ── 4. Fast-forward master and push it ───────────────────────────────────────
if [ "$BEHIND" -eq 0 ]; then
  info "$TARGET_BRANCH already matches $FEATURE_BRANCH — skipping merge."
else
  info "Fast-forwarding $TARGET_BRANCH to $FEATURE_BRANCH"
  git checkout --quiet "$TARGET_BRANCH"
  git merge --ff-only "$FEATURE_BRANCH"
  ok "$TARGET_BRANCH fast-forwarded."
fi

git checkout --quiet "$TARGET_BRANCH" 2>/dev/null || true
info "Pushing $TARGET_BRANCH to $REMOTE"
git push --set-upstream "$REMOTE" "$TARGET_BRANCH"
ok "$TARGET_BRANCH pushed."

# ── 5. Back to the feature branch ────────────────────────────────────────────
git checkout --quiet "$FEATURE_BRANCH"

printf '\n'
ok "Deploy complete — $FEATURE_BRANCH and $TARGET_BRANCH are in sync on $REMOTE."
git --no-pager log --oneline -1
