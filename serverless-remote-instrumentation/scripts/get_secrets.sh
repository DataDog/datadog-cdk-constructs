#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2023 Datadog, Inc.

set -e

if [ -z "$EXTERNAL_ID_NAME" ]; then
    printf "[Error] No EXTERNAL_ID_NAME found.\n"
    printf "Exiting script...\n"
    exit 1
fi

if [ -z "$ROLE_TO_ASSUME" ]; then
    printf "[Error] No ROLE_TO_ASSUME found.\n"
    printf "Exiting script...\n"
    exit 1
fi

printf "Getting AWS External ID...\n"

EXTERNAL_ID=$(vault kv get -field=$EXTERNAL_ID_NAME kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)

printf "Getting DD API KEY...\n"

export DD_API_KEY=$(vault kv get -field=dd-api-key kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)

printf "Getting GitHub Token"

export GH_APP_ID=$(vault kv get -field="gh_app_id" kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)
export GH_PRIVATE_KEY=$(vault kv get -field="gh_private_key" kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)
export GH_INSTALLATION_ID=$(vault kv get -field="gh_installation_id" kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)

# Write private key to a temporary file
PRIVATE_KEY_FILE=$(mktemp)
echo "$GH_PRIVATE_KEY" > "$PRIVATE_KEY_FILE"

export JWT_TOKEN=$(bash .gitlab/scripts/generate_jwt.sh $GH_APP_ID $PRIVATE_KEY_FILE)

export GH_TOKEN=$(curl -s -X POST \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/app/installations/$GH_INSTALLATION_ID/access_tokens" | jq -r '.token')

gh auth status

printf "Assuming role...\n"

export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" \
    $(aws sts assume-role \
    --role-arn "arn:aws:iam::$AWS_ACCOUNT:role/$ROLE_TO_ASSUME"  \
    --role-session-name "ci.serverless-remote-instrumentation-$CI_JOB_ID-$CI_JOB_STAGE" \
    --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
    --external-id $EXTERNAL_ID \
    --output text))
