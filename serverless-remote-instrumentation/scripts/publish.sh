#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2025 Datadog, Inc.

# From repo root, execute the script with `VERSION=<DESIRED_VERSION> ./scripts/publish.sh`

set -e

# A region needs to be set to track versions, it should be
# the same across all versions in prod so just pick one
REGION="us-east-1"
ARCHITECTURE="arm64"
TEMPLATE_VERSION=$(jq -r .version ./integration-tests/config.json)
LAYER_NAME="Datadog-Serverless-Remote-Instrumentation-ARM"

if [ "$ACCOUNT" == "prod" ]; then
  echo "Running in prod, checking if version $TEMPLATE_VERSION is already published"
  if aws s3api get-object --bucket $BUCKET --key $OBJECT_PREFIX$TEMPLATE_VERSION.yaml getresult.yaml &>/dev/null; then
      echo "Version $TEMPLATE_VERSION is already published, skipping"
      exit 0
  fi
fi

LAST_LAYER_VERSION=$(
    aws lambda list-layer-versions \
        --layer-name $LAYER_NAME \
        --region $REGION \
    | jq -r ".LayerVersions | .[0] |  .Version" \
)
if [ "$LAST_LAYER_VERSION" == "null" ]; then
    echo "Error auto-detecting the last layer version"
    exit 1
fi

VERSION=$(($LAST_LAYER_VERSION+1))
echo "Will publish new layer version as $VERSION"

VERSION=$VERSION ARCHITECTURE=$ARCHITECTURE ${SCRIPTS_PATH}/build_layer.sh

# Sign the layer
${SCRIPTS_PATH}/sign_layers.sh

# Publish the layer
VERSION=$VERSION ${SCRIPTS_PATH}/publish_layers.sh

TEMPLATE_VERSION=$TEMPLATE_VERSION VERSION=$VERSION ${SCRIPTS_PATH}/publish_template.sh