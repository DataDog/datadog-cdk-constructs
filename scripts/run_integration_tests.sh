#!/bin/bash

# Usage - run commands from repo root:
# To check if new changes to the library cause changes to any snapshots:
#   ./scripts/run_integration_tests.sh
# To regenerate snapshots:
#   UPDATE_SNAPSHOTS=true ./scripts/run_integration_tests.sh

set -e

# To add new tests create a new ts file in the 'integration_tests/stacks' directory, append its file name to the STACK_CONFIGS array.
# Note: Each ts file will have its respective snapshot built in the snapshots directory, e.g. lambda-function-stack.ts
#       will generate both snapshots/test-lambda-function-stack-snapshot.json and snapshots/correct-lambda-function-stack-snapshot.json
STACK_CONFIGS=("lambda-function-stack" "lambda-nodejs-function-stack")

script_path=${BASH_SOURCE[0]}
scripts_dir=$(dirname $script_path)
repo_dir=$(dirname $scripts_dir)
root_dir=$(pwd)
if [[ "$root_dir" =~ .*"datadog-cdk-constructs/scripts".* ]]; then
    echo "Make sure to run this script from the root $(datadog-cdk-constructs) directory, aborting"
    exit 1
fi

integration_tests_dir="$repo_dir/integration_tests/"
if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
    echo "Overwriting snapshots in this execution"
fi

# Login to ECR. This is a required step in order to pull a public Docker image for the PythonFunction construct
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

yarn
yarn build

cd $integration_tests_dir
RAW_CFN_TEMPLATE="cdk.out/ExampleDatadogStack.template.json"

OUTPUT_ARRAY+=("====================================")
allTestsPassed=true
compose_output() {
     if [ $1 -eq 0 ]; then
        OUTPUT_ARRAY+=("SUCCESS: There were no differences between the $2 and $3")
    else
        allTestsPassed=false
        OUTPUT_ARRAY+=("FAILURE: There were differences between the $2 and $3. Review the diff output above.")
        OUTPUT_ARRAY+=("If you expected the $2 to be different generate new snapshots by running this command from a development branch on your local repository: 'UPDATE_SNAPSHOTS=true ./scripts/run_integration_tests.sh'")
    fi
    OUTPUT_ARRAY+=("====================================")
}

printOutputAndExit() {
    for ((i=0; i < ${#OUTPUT_ARRAY[@]}; i++)); do
        echo ${OUTPUT_ARRAY[i]}
    done

    if [ $allTestsPassed ]; then
        exit 0
    else
        exit 1
    fi
}

for ((i=0; i < ${#STACK_CONFIGS[@]}; i++)); do
    tsc --project tsconfig.json
    cdk synth --app testlib/integration_tests/stacks/${STACK_CONFIGS[i]}.js --json --quiet

    # Normalize LambdaVersion IDs
    perl -p -i -e 's/(LambdaVersion.*")/LambdaVersionXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize S3Key timestamps
    perl -p -i -e 's/("S3Key".*)/"S3Key": "serverless\/dd-cdk-construct-integration-test\/dev\/XXXXXXXXXXXXX-XXXX-XX-XXXXX:XX:XX.XXXX\/dd-cdk-construct-integration-test.zip"/g' ${RAW_CFN_TEMPLATE}
    # Normalize dd_cdk_construct version tag value
    perl -p -i -e 's/(v\d+.\d+.\d+)/vX.XX.X/g' ${RAW_CFN_TEMPLATE}
    # Normalize Role names
    perl -p -i -e 's/("HelloHandlerServiceRole.*")/"HelloHandlerServiceRoleXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
     # Normalize Handler names
    perl -p -i -e 's/("HelloHandler(?!ServiceRole)(\d+|\w+)*")/"HelloHandlerXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize AssetParameters
    perl -p -i -e 's/("AssetParameters.*")/"AssetParametersXXXXXXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize CDK Metadata Analytics
    perl -p -i -e 's/("Analytics": "v.*")/"Analytics": "vX:XXXXXX:XXXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize S3 Bucket for asset
    perl -p -i -e 's/(for asset .*")/for asset XXXXXXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize Metadata aws:asset:path
    perl -p -i -e 's/("asset\..*")/"asset.XXXXXXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize Datadog Layer Arn versions
    perl -p -i -e 's/(arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-(Python27|Python36|Python37|Python38|Python39|Node10-x|Node12-x|Node14-x|Extension):\d+)/arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-\2:XXX/g' ${RAW_CFN_TEMPLATE}
    # Normalize API Gateway timestamps
    perl -p -i -e 's/("ApiGatewayDeployment.*")/"ApiGatewayDeploymentxxxx"/g' ${RAW_CFN_TEMPLATE}

    TEST_SNAPSHOT="snapshots/test-${STACK_CONFIGS[i]}-snapshot.json"
    CORRECT_SNAPSHOT="snapshots/correct-${STACK_CONFIGS[i]}-snapshot.json"

    cp ${RAW_CFN_TEMPLATE} ${TEST_SNAPSHOT}
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        echo "Overriding ${CORRECT_SNAPSHOT}"
        cp ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
    fi

    OUTPUT_ARRAY+=("Performing diff of ${TEST_SNAPSHOT} against ${CORRECT_SNAPSHOT}")
    set +e # Don't exit right away if there is a diff in snapshots
    diff ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
    return_code=$?
    set -e
    compose_output $return_code ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
done

printOutputAndExit