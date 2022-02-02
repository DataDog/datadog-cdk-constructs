#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2021 Datadog, Inc.

set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ $BRANCH != "main" ]; then
    echo "Not on main, aborting"
    exit 1
else
    echo "Updating main"
    git pull origin main
fi

#Read the current package version
CURRENT_VERSION=$(node -pe "require('./package.json').version")

#Read github and package release versions
if [ -z "$2" ]; then
    echo "Must specify two arguments: new github release version (first argument), new package release version (second argument)"
    exit 1
elif [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Must use a semantic version, e.g. 3.1.4, for the github release version number"
    exit 1
elif [[ ! $2 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Must use a semantic version, e.g. 3.1.4, for the package release version number"
    exit 1
else
    GITHUB_VERSION=$1
    PACKAGE_VERSION=$2
fi

#Confirm to proceed
read -p "

Please confirm the github and package versions before proceeding (versions will not be bumped yet.):
New github release version: ${GITHUB_VERSION}
New package release version: ${PACKAGE_VERSION}

Continue (y/n)?" CONT
if [ "$CONT" != "y" ]; then
    echo "Exiting"
    exit 1
fi

if ! [ -x "$(command -v yarn)" ]; then
  echo 'Error: yarn is not installed.'
  exit 1
fi
if ! [ -x "$(command -v pip)" ]; then
  echo 'Error: pip is not installed.'
  exit 1
fi
pip3 install --upgrade twine
if ! [ -x "$(command -v python3)" ]; then
  echo 'Error: python3 is not installed.'
  exit 1
fi

# Make sure dependencies are installed before proceeding
yarn

read -p "Do you have the PyPI and npm login credentials for the Datadog account (y/n)?" CONT
if [ "$CONT" != "y" ]; then
    echo "Exiting"
    exit 1
fi

echo "Removing folder 'dist' to clear previously built distributions"
rm -rf dist;

#Confirm to proceed
read -p "About to publish, releasing version ${GITHUB_VERSION} to github and bumping package version from ${CURRENT_VERSION} to ${PACKAGE_VERSION}. Continue (y/n)?" CONT
if [ "$CONT" != "y" ]; then
    echo "Exiting"
    exit 1
fi

if git rev-parse "v${GITHUB_VERSION}" >/dev/null 2>&1; then
    echo "tag v${GITHUB_VERSION} already exists, aborting"
    exit 1
fi

echo "Bumping package version to ${PACKAGE_VERSION}"
node ./src/common/scripts/bump-version.js ${PACKAGE_VERSION}

echo "Updating CHANGELOG.md and committing changes"
if git log --oneline -1 | grep -q "chore(release):"; then
    echo "Create a new commit before attempting to release. Be sure to not include 'chore(release):' in the commit message. This means if the script previously prematurely ended without publishing you may need to 'git reset --hard' to a previous commit before trying again, aborting"
    exit 1
else
    node ./src/common/scripts/bump-version.js $GITHUB_VERSION
    yarn standard-version --release-as $GITHUB_VERSION
    node ./src/common/scripts/bump-version.js $PACKAGE_VERSION
    git add .
    git commit -m "chore(release): ${GITHUB_VERSION}" 
fi

echo "Creating github version tag"
git tag $GITHUB_VERSION HEAD

echo "Building artifacts"
yarn build
#Make sure artifacts were created before publishing
JS_TARBALL=./dist/js/datadog-cdk-constructs-v2@$PACKAGE_VERSION.jsii.tgz
if [ ! -f $JS_TARBALL ]; then
    echo "'${JS_TARBALL}' not found. Run 'yarn build' and ensure this file is created."
    exit 1
fi

PY_WHEEL=./dist/python/datadog_cdk_constructs_v2-$PACKAGE_VERSION-py3-none-any.whl
if [ ! -f $PY_WHEEL ]; then
    echo "'${PY_WHEEL}' not found. Run 'yarn build' and ensure this file is created."
    exit 1
fi

PY_TARBALL=./dist/python/datadog-cdk-constructs-v2-$PACKAGE_VERSION.tar.gz
if [ ! -f $PY_TARBALL ]; then
    echo "'${PY_TARBALL}' not found. Run 'yarn build' and ensure this file is created."
    exit 1
fi

yarn logout
yarn login

echo "Publishing to npm"
yarn publish $JS_TARBALL --new-version "$PACKAGE_VERSION"

echo "Publishing to PyPI"
python3 -m twine upload ./dist/python/*

echo 'Pushing updates to github'
git push origin main
git push origin "refs/tags/v$GITHUB_VERSION"
echo 'Please add release notes in GitHub!'
