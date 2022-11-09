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

#Read release version
if [ -z "$1" ]; then
    echo "Must specify a desired version number"
    exit 1
elif [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Must use a semantic version, e.g., 3.1.4"
    exit 1
else
    VERSION=$1
fi

#Confirm to proceed
read -p "

Please confirm the github and package versions before proceeding (versions will not be bumped yet.):
New github release version: v${VERSION}
New package release version: ${VERSION}

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

read -p "Do you have access to the serverless shared vault in 1Password?" CONT
if [ "$CONT" != "y" ]; then
    echo "Exiting"
    exit 1
fi

echo "Removing folder 'dist' to clear previously built distributions"
rm -rf dist;

#Confirm to proceed
read -p "About to publish, releasing version v${VERSION} to github and bumping package version to ${VERSION}. Continue (y/n)?" CONT
if [ "$CONT" != "y" ]; then
    echo "Exiting"
    exit 1
fi

if git rev-parse "v${VERSION}" >/dev/null 2>&1; then
    echo "tag v${VERSION} already exists, aborting. If the script previously prematurely ended without publishing, make sure to delete the tag before trying again."
    exit 1
fi

if git log --oneline -1 | grep -q "chore(release):"; then
    echo "The previous commit was a release, 'chore(release):' is in the commit message. If the script previously prematurely ended without publishing you may need to 'git reset --hard' to a previous commit before trying again."
    echo "If you just released version 2, you can ignore this message and continue."
    read -p "Proceed anyways (y/n)?" CONT
    if [ "$CONT" != "y" ]; then
        echo "Exiting"
        exit 1
    fi
fi

echo "Bumping package version, updating CHANGELOG.md, and committing changes"
yarn standard-version --release-as $VERSION

echo "Building artifacts"
yarn build
#Make sure artifacts were created before publishing
JS_TARBALL=./dist/js/datadog-cdk-constructs@$VERSION.jsii.tgz
if [ ! -f $JS_TARBALL ]; then
    echo "'${JS_TARBALL}' not found. Run 'yarn build' and ensure this file is created."
    exit 1
fi

PY_WHEEL=./dist/python/datadog_cdk_constructs-$VERSION-py3-none-any.whl
if [ ! -f $PY_WHEEL ]; then
    echo "'${PY_WHEEL}' not found. Run 'yarn build' and ensure this file is created."
    exit 1
fi

PY_TARBALL=./dist/python/datadog-cdk-constructs-$VERSION.tar.gz
if [ ! -f $PY_TARBALL ]; then
    echo "'${PY_TARBALL}' not found. Run 'yarn build' and ensure this file is created."
    exit 1
fi

yarn logout
yarn login

echo "Publishing to npm"
yarn publish $JS_TARBALL --new-version "$VERSION"

echo "Publishing to PyPI"
echo "Please enter the token (password) for datadog-cdk-constructs PyPI"
python3 -m twine upload -u __token__ ./dist/python/*

echo 'Pushing updates to github'
git push origin main
git push origin "refs/tags/v$VERSION"
echo 'Please add release notes in GitHub!'
