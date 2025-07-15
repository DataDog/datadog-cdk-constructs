#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2024 Datadog, Inc.

# Usage: ./publish_template.sh <Desired Version> <Account [sandbox|prod]>
# e.g.  ./publish_cf_template.sh 0.5.1 sandbox
# When publishing to sandbox, the template version number is NOT updated and no github release is created!

set -e

# Read the desired version
if [ -z $TEMPLATE_VERSION ]; then
    echo "ERROR: You must specify a desired version number"
    exit 1
elif [[ ! $TEMPLATE_VERSION =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
    echo "ERROR: You must use a semantic version (e.g. 3.1.4)"
    exit 1
else
    TEMPLATE_VERSION=$TEMPLATE_VERSION
fi

# Check account parameter
VALID_ACCOUNTS=("sandbox" "prod")
if [ -z $ACCOUNT ]; then
    echo "ERROR: You must pass an ACCOUNT parameter. Please choose sandbox or prod."
    exit 1
fi
if [[ ! "${VALID_ACCOUNTS[@]}" =~ $ACCOUNT ]]; then
    echo "ERROR: The ACCOUNT parameter was invalid. Please choose sandbox or prod."
    exit 1
fi

rm -rf dist
mkdir dist

cp template.yaml dist/template.yaml

# Slot the layer version into the template
sed -i -e "s/{CURRENT_LAYER_VERSION}/$VERSION/g" dist/template.yaml

# Validate the template
echo "Validating template.yaml..."
aws cloudformation validate-template --template-body file://dist/template.yaml
echo "Uploading the CloudFormation Template"
if [ "$ACCOUNT" = "prod" ]; then
    aws s3 cp dist/template.yaml s3://${BUCKET}/${OBJECT_PREFIX}${TEMPLATE_VERSION}.yaml \
        --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
    aws s3 cp dist/template.yaml s3://${BUCKET}/${OBJECT_PREFIX}latest.yaml \
        --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
    TEMPLATE_URL="https://${BUCKET}.s3.amazonaws.com/${OBJECT_PREFIX}latest.yaml"

    # Create a release
    git remote set-url origin https://github.com/DataDog/serverless-remote-instrumentation.git
    gh auth status
    git config --global user.name "gitlab-actions[bot]"
    git config --global user.email "gitlab-actions[bot]@users.noreply.github.com"
    gh release create -d "v$(jq -r .version ./integration-tests/config.json)" --generate-notes
else
    sed -i -e "s/Number: 464622532012/Number: 425362996713/g" dist/template.yaml
    aws s3 cp dist/template.yaml s3://${BUCKET}/${OBJECT_PREFIX}${TEMPLATE_VERSION}.yaml
    aws s3 cp dist/template.yaml s3://${BUCKET}/${OBJECT_PREFIX}latest.yaml
    TEMPLATE_URL="https://${BUCKET}.s3.amazonaws.com/${OBJECT_PREFIX}latest.yaml"
fi

echo "TEMPLATE_VERSION: $TEMPLATE_VERSION"
echo "ACCOUNT: $ACCOUNT"
echo "TEMPLATE_URL: $TEMPLATE_URL"
echo "BUCKET: $BUCKET"

echo "Done uploading the CloudFormation template!"
echo
echo "Here is the CloudFormation quick launch URL:"
echo "https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?stackName=datadog-remote-instrument&templateURL=${TEMPLATE_URL}"
echo
echo "Serverless Remote Instrumentation release process complete!"
