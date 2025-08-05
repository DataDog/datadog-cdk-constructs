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

# Update the template version to be whatever was in the args
node scripts/update_template_version.js $RELEASE_VERSION

# Update LICENSE-3rdparty.csv using dd-license-attribution on the serverless-remote-instrumentation repo
echo "Updating LICENSE-3rdparty.csv with dependency changes..."
if command -v dd-license-attribution &> /dev/null; then
    echo "Running dd-license-attribution on serverless-remote-instrumentation repository..."
    ddtool auth github login
    GITHUB_TOKEN=$(ddtool auth github token) dd-license-attribution --override-spec scripts/.ddla-overrides https://github.com/DataDog/serverless-remote-instrumentation > LICENSE-3rdparty.csv.new

    if [ $? -eq 0 ]; then
        mv LICENSE-3rdparty.csv.new LICENSE-3rdparty.csv
        echo "Successfully updated LICENSE-3rdparty.csv"
    else
        echo "Warning: Failed to update LICENSE-3rdparty.csv, keeping existing file"
        rm -f LICENSE-3rdparty.csv.new
    fi
else
    echo "Warning: dd-license-attribution tool not found. Skipping LICENSE-3rdparty.csv update."
    echo "Install with: pip install git+https://github.com/DataDog/dd-license-attribution.git"
fi

# Create a commit with all of the commit info for commits in this release
git add template.yaml LICENSE-3rdparty.csv
INCLUDED_COMMITS=$(git log $(git describe --tags --abbrev=0)..HEAD --no-merges --oneline)
git commit -m "Release v$RELEASE_VERSION

This release includes the following commits:
$(echo "$INCLUDED_COMMITS")
"

# Tag it and push to a release branch
git tag "v$RELEASE_VERSION"
git push --atomic origin "$(git rev-parse --abbrev-ref HEAD):release-v$RELEASE_VERSION" v$RELEASE_VERSION

# Log information to create a PR
echo "Go to the following URL to create a PR for the release.  Please add a comprehensive description"
echo "https://github.com/DataDog/serverless-remote-instrumentation/compare/release-v$RELEASE_VERSION?expand=1"