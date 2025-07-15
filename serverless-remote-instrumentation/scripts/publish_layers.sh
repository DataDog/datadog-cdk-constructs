#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2020 Datadog, Inc.

# Publish the datadog lambda layer across regions, using the AWS CLI
# Usage: VERSION=5 REGIONS=us-east-1 ARCHITECTURE=amd64 publish_layers.sh

# VERSION is required.
# REGIONS is optional. By default, publish to all regions.
# ARCHITECTURE is optional. By default, publish both architectures.

set -e

# Move into the root directory, so this script can be called from any directory
cd $SCRIPTS_PATH

if [ "$ARCHITECTURE" == "amd64" ]; then
  echo "ARCHITECTURE should not be amd64. The remote instrumenter only works for amd64."
  exit 1
fi

echo "Publishing arm64 layer"
LAYER_PATHS=(".layers/datadog_serverless_remote_instrumentation_arm64.zip")
LAYER_NAMES=("Datadog-Serverless-Remote-Instrumentation-ARM")
#fi

AVAILABLE_REGIONS=$(aws ec2 describe-regions | jq -r '.[] | .[] | .RegionName')

# Check that the layer files exist
for layer_file in "${LAYER_PATHS[@]}"
do
    if [ ! -f $layer_file  ]; then
        echo "Could not find $layer_file."
        exit 1
    fi
done

# Determine the target regions
if [ -z "$REGIONS" ]; then
    echo "Region not specified, running for all available regions."
    REGIONS=$AVAILABLE_REGIONS
else
    echo "Region specified: $REGIONS"
    if [[ ! "$AVAILABLE_REGIONS" == *"$REGIONS"* ]]; then
        echo "Could not find $REGIONS in available regions: $AVAILABLE_REGIONS"
        echo ""
        echo "EXITING SCRIPT."
        exit 1
    fi
fi

LAYERS=("${LAYER_NAMES[@]}")

# Determine the target layer version
if [ -z "$VERSION" ]; then
    echo "Layer version not specified"
    echo ""
    echo "EXITING SCRIPT."
    exit 1
else
    echo "Layer version specified: $VERSION"
fi

#if [ "$ARCHITECTURE" == "amd64" ]; then
#    ARCHITECTURE_MESSAGE="amd64 only"
#elif [ "$ARCHITECTURE" == "arm64" ]; then
ARCHITECTURE_MESSAGE="arm64 only"
#else
#    ARCHITECTURE_MESSAGE="both architectures"
#fi

echo $VERSION &> ".layers/version"

index_of_layer() {
    layer_name=$1
    for i in "${!LAYER_NAMES[@]}"; do
        if [[ "${LAYER_NAMES[$i]}" = "${layer_name}" ]]; then
            echo "${i}";
        fi
    done
}

publish_layer() {
    region=$1
    layer_name=$2
    file=$3

    version_nbr=$(aws lambda publish-layer-version --layer-name "${layer_name}" \
        --description "Datadog Serverless Remote Instrumentation ARM" \
        --zip-file "fileb://${file}" \
        --compatible-architectures arm64 \
        --region $region | jq -r '.Version')

    permission=$(aws lambda add-layer-version-permission --layer-name $layer_name \
        --version-number $version_nbr \
        --statement-id "release-$version_nbr" \
        --action lambda:GetLayerVersion --principal "*" \
        --region $region)

    echo $version_nbr
}

for region in $REGIONS
do
    echo "Starting publishing layers for region $region..."
    for layer_name in "${LAYERS[@]}"; do
        if [ ! -z "$SUFFIX" ]; then
            layer_name+="-$SUFFIX"
        fi
        latest_version=$(aws lambda list-layer-versions --region $region --layer-name "${layer_name}" --query 'LayerVersions[0].Version || `0`')
        if [ $latest_version -ge $VERSION ]; then
            echo "Layer $layer_name  version $VERSION already exists in region $region, skipping..."
            continue
        elif [ $latest_version -lt $((VERSION-1)) ]; then
            echo "WARNING: The latest version of layer $layer_name in region $region is $latest_version, publishing all the missing versions including $VERSION"
        fi

        # If the region is more than 1 version behind, publish all the missing versions
        while [ $latest_version -lt $((VERSION-1)) ]; do
            # Download the layer from us-east-1.  This can be any region we've always published to
            URL=$(aws lambda get-layer-version --layer-name $layer_name  --version-number $latest_version --query Content.Location --output text --region us-east-1)
            curl $URL -o "./temp_layer.zip"
            # Publish the layer in the new region
            latest_version=$(publish_layer $region $layer_name "./temp_layer.zip")
            echo "Published version $latest_version for layer $layer_name in region $region"
            rm "./temp_layer.zip"
        done

        # Now publish the current version
        index=$(index_of_layer $layer_name)
        layer_path="${LAYER_PATHS[$index]}"
        latest_version=$(publish_layer $region $layer_name $layer_path)
        echo "Published version $latest_version for layer $layer_name in region $region"
    done
done

echo "Done !"
