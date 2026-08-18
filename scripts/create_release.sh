#!/bin/bash

set -euo pipefail

RELEASE_VERSION=${1:-}

fail() {
    echo "ERROR: $1" >&2
    exit 1
}

echo "Attempting to create release version $RELEASE_VERSION"

if [ -z "$RELEASE_VERSION" ]; then
    fail "You must specify a desired version number like: yarn create-release #.#.#"
elif [[ ! "$RELEASE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    fail "You must use a semantic version (e.g. 3.1.4)"
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
VERSION_FILE="$REPO_ROOT/version.json"
START_BRANCH=$(git branch --show-current)
START_COMMIT=$(git rev-parse HEAD)
RELEASE_TAG="v2-$RELEASE_VERSION"
RELEASE_BRANCH="release-$RELEASE_TAG"

[ "$START_BRANCH" = "main" ] || fail "Releases must be created from main."
[ -z "$(git status --porcelain)" ] || fail "The working tree must be clean."

# The previous release commit may be outside a shallow clone's history.
if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
    git fetch --unshallow origin '+refs/heads/main:refs/remotes/origin/main' --quiet
else
    git fetch origin '+refs/heads/main:refs/remotes/origin/main' --quiet
fi
git fetch origin 'refs/tags/*:refs/tags/*' --quiet

[ "$START_COMMIT" = "$(git rev-parse origin/main)" ] || fail "Local main must match origin/main."

if git show-ref --verify --quiet "refs/tags/$RELEASE_TAG"; then
    fail "Version $RELEASE_VERSION already exists."
fi
if git show-ref --verify --quiet "refs/heads/$RELEASE_BRANCH"; then
    fail "Local branch $RELEASE_BRANCH already exists."
fi
if [ -n "$(git ls-remote --heads origin "refs/heads/$RELEASE_BRANCH")" ]; then
    fail "Remote branch $RELEASE_BRANCH already exists."
fi

CURRENT_VERSION=$(jq -er '.version | select(type == "string")' "$VERSION_FILE")
PREVIOUS_TAG="v2-$CURRENT_VERSION"
if ! PREVIOUS_RELEASE_COMMIT=$(git rev-parse --verify "refs/tags/$PREVIOUS_TAG^{commit}" 2>/dev/null); then
    fail "Could not find previous release tag $PREVIOUS_TAG."
fi
PREVIOUS_RELEASE_BASE=$(git rev-parse "$PREVIOUS_RELEASE_COMMIT^")
git merge-base --is-ancestor "$PREVIOUS_RELEASE_BASE" HEAD || fail "$PREVIOUS_TAG is not based on main."

# The tag's parent is the code shipped in the previous release. Exclude the
# corresponding version-only commit merged into main from the next changelog.
PREVIOUS_VERSION_COMMIT=$(git log -1 --format=%H -- "$VERSION_FILE")
[ -n "$PREVIOUS_VERSION_COMMIT" ] || fail "Could not find the previous version commit."
VERSION_AT_COMMIT=$(git show "$PREVIOUS_VERSION_COMMIT:version.json" | jq -er '.version | select(type == "string")')
[ "$VERSION_AT_COMMIT" = "$CURRENT_VERSION" ] || fail "The previous version commit does not set version $CURRENT_VERSION."

INCLUDED_COMMITS=$(
    git log "$PREVIOUS_RELEASE_BASE"..HEAD --no-merges --format='%H%x09%h %s' |
        awk -F '\t' -v excluded="$PREVIOUS_VERSION_COMMIT" '$1 != excluded { print $2 }'
)

CREATED_TAG=false
PUSHED=false
cleanup_release() {
    status=$?
    trap - EXIT
    set +e
    rm -f "$VERSION_FILE.tmp"
    if [ "$(git branch --show-current)" = "$RELEASE_BRANCH" ]; then
        git reset --hard "$START_COMMIT" >/dev/null 2>&1
        git switch --quiet "$START_BRANCH" >/dev/null 2>&1
    fi
    if git show-ref --verify --quiet "refs/heads/$RELEASE_BRANCH"; then
        git branch -D "$RELEASE_BRANCH" >/dev/null 2>&1
    fi
    if [ "$CREATED_TAG" = "true" ] && [ "$PUSHED" = "false" ]; then
        git tag -d "$RELEASE_TAG" >/dev/null 2>&1
    fi
    exit "$status"
}
trap cleanup_release EXIT

git switch --quiet -c "$RELEASE_BRANCH"
jq --arg v "$RELEASE_VERSION" '.version = $v' "$VERSION_FILE" > "$VERSION_FILE.tmp"
mv "$VERSION_FILE.tmp" "$VERSION_FILE"
git add "$VERSION_FILE"
git commit -m "chore: Release $RELEASE_TAG

This release includes the following commits:
$INCLUDED_COMMITS
"

git tag -m "Release $RELEASE_TAG" "$RELEASE_TAG"
CREATED_TAG=true
git push --atomic origin "$RELEASE_BRANCH" "$RELEASE_TAG"
PUSHED=true

git switch --quiet "$START_BRANCH"
git branch -D "$RELEASE_BRANCH" >/dev/null
trap - EXIT

echo "Go to the following URL to create a PR for the release. Please add a comprehensive description"
echo "https://github.com/DataDog/datadog-cdk-constructs/compare/$RELEASE_BRANCH?expand=1"
