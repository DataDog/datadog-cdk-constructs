#!/bin/bash

RELEASE_VERSION=$1

echo "Attempting to create release version $RELEASE_VERSION"

# Check that the release version exists and is properly formatted
if [ -z $RELEASE_VERSION ]; then
    echo "ERROR: You must specify a desired version number like"
    echo "yarn create-release #.#.#"
    exit 1
elif [[ ! $RELEASE_VERSION =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
    echo "ERROR: You must use a semantic version (e.g. 3.1.4)"
    exit 1
fi

# Check that the release version has not already been published
MATCHING_GITHUB_VERSION=$(git tag -l | grep $RELEASE_VERSION)
if [ $MATCHING_GITHUB_VERSION ]; then
    echo "ERROR: Version $MATCHING_GITHUB_VERSION already exists"
    exit 1
fi

# Create a commit with all of the commit info for commits in this release
INCLUDED_COMMITS=$(git log $(git describe --tags --abbrev=0)..HEAD --no-merges --oneline)
git commit -m "Release v$RELEASE_VERSION

This release includes the following commits:
$(echo "$INCLUDED_COMMITS")
"

# Tag it and push to a release branch
git tag "v2-$RELEASE_VERSION"
git push --atomic origin "$(git rev-parse --abbrev-ref HEAD):release-v2-$RELEASE_VERSION" v$RELEASE_VERSION

# Log information to create a PR
echo "Go to the following URL to create a PR for the release.  Please add a comprehensive description"
echo "https://github.com/DataDog/datadog-cdk-constructs/compare/release-v2-$RELEASE_VERSION?expand=1"