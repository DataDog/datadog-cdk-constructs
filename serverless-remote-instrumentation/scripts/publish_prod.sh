#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2024 Datadog, Inc.

# From repo root, execute the script with `VERSION=<DESIRED_VERSION> ./scripts/publish_prod.sh`

set -e

# Ensure the target version is defined
if [ -z "$VERSION" ]; then
    echo "New layer version not specified"
    echo ""
    echo "EXITING SCRIPT."
    exit 1
fi

# Ensure there are no uncommitted changes
cd ~/dd/Serverless-Remote-Instrumentation

if [[ `git status --porcelain` ]]; then
    echo "Detected uncommitted changes, aborting"
    exit 1
fi

CURRENT_SHA=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
echo "Current commit: $CURRENT_SHA"
echo "Current commit message: $COMMIT_MESSAGE"
echo
read -p "Ready to publish new Layer version $VERSION to Prod (y/n)?" CONT
if [ "$CONT" != "y" ]; then
    echo "Exiting"
    exit 1
fi
cd -

if [ -z $ARCHITECTURE ]; then
    echo "No architecture specified, defaulting to arm64"
    ARCHITECTURE="arm64"
fi

# Move into the root directory
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $SCRIPTS_DIR/..

echo "Checking that you have access to the commercial AWS account"
aws-vault exec sso-prod-engineering -- aws sts get-caller-identity

VERSION=$VERSION ARCHITECTURE=$ARCHITECTURE ./scripts/build_layer.sh

echo "Signing the layer"
aws-vault exec sso-prod-engineering -- ./scripts/sign_layers.sh prod

echo "Publishing layers to commercial AWS regions"
aws-vault exec sso-prod-engineering --no-session -- ./scripts/publish_layers.sh

echo "Creating tag in the Serverless-Remote-Instrumentation repository for release on GitHub"
git tag "v$VERSION"
git push origin "refs/tags/v$VERSION"

echo "New layer version published to AWS!"
echo
echo "IMPORTANT: Please follow the following steps to create release notes:"
echo "1. Manually create a new tag called v${VERSION} in the Serverless-Remote-Instrumentation repository"
echo "2. Create a new GitHub release in the Serverless-Remote-Instrumentation using the tag v${VERSION}, and add release notes"
echo ">>> https://github.com/DataDog/Serverless-Remote-Instrumentation/releases/new?tag=v${VERSION}&title=v${VERSION}"
