#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2024 Datadog, Inc.

# Running from the repo root directory, this script installs all packages, zip them locally, and
# then publish the zip file via AWS CLI
# Usage: VERSION=1 REGION=eu-west-2 ./scripts/publish_sandbox.sh
# Usage: VERSION=15 REGION=us-west-1 ./scripts/publish_sandbox.sh

# Optional environment variables:
# VERSION - Use a specific version number. By default, increment the version by 1.
# The architecture built is ARM only.

set -e

if [ -z $ARCHITECTURE ]; then
    echo "No architecture specified, defaulting to arm64"
    ARCHITECTURE="arm64"
fi

LAYER_NAME="Datadog-Serverless-Remote-Instrumentation-ARM"

if [ ! -z "$SUFFIX" ]; then
   LAYER_NAME+="-$SUFFIX"
fi

REGION=$REGION

if [ -z $VERSION ]; then
    echo "No version specified, automatically incrementing version number"

    if [ $GITLAB_CI ]; then
        LAST_LAYER_VERSION=$(
            aws lambda list-layer-versions \
                --layer-name $LAYER_NAME \
                --region $REGION \
            | jq -r ".LayerVersions | .[0] |  .Version" \
        )
    else
        LAST_LAYER_VERSION=$(
            aws-vault exec sso-serverless-sandbox-account-admin -- \
            aws lambda list-layer-versions \
                --layer-name $LAYER_NAME \
                --region $REGION \
            | jq 'if .LayerVersions | length == 0 then 0 else .LayerVersions |.[0] | .Version  end'
        )
    fi
    if [ "$LAST_LAYER_VERSION" == "null" ]; then
        echo "Error auto-detecting the last layer version"
        exit 1
    else
        VERSION=$(($LAST_LAYER_VERSION+1))
        echo "Will publish new layer version as $VERSION"
    fi
fi

# Move into the root directory
cd $SCRIPTS_PATH/..

VERSION=$VERSION ARCHITECTURE=$ARCHITECTURE ${SCRIPTS_PATH}/build_layer.sh

echo "Publishing layers to sandbox"
if [ $GITLAB_CI ]; then
    VERSION=$VERSION ARCHITECTURE=$ARCHITECTURE REGIONS=$REGION ${SCRIPTS_PATH}/publish_layers.sh
else
    VERSION=$VERSION ARCHITECTURE=$ARCHITECTURE REGIONS=$REGION aws-vault exec sso-serverless-sandbox-account-admin -- ${SCRIPTS_PATH}/publish_layers.sh
fi
