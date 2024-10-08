#!/bin/bash

# Usage - run commands from repo root:
# To check if new changes to the library cause changes to any snapshots:
#   ./scripts/run_integration_tests.sh
# To regenerate snapshots:
#   UPDATE_SNAPSHOTS=true aws-vault exec serverless-sandbox-account-admin -- ./scripts/run_integration_tests.sh

set -e

# To add new tests create a new ts file in the 'integration_tests/stacks' directory, append its file path to the STACK_CONFIG_PATHS array.
# Note: Each ts file will have its respective snapshot built in the snapshots directory, e.g. lambda-function-stack.ts
#       will generate both snapshots/test-lambda-function-stack-snapshot.json and snapshots/correct-lambda-function-stack-snapshot.json
STACK_CONFIG_PATHS=(
    "typescript/lambda-provided-stack.ts"
    "typescript/lambda-provided-arm-stack.ts"
    "typescript/lambda-singleton-function-stack.ts"
    "typescript/lambda-function-arm-stack.ts"
    "typescript/lambda-function-stack.ts"
    "typescript/lambda-nodejs-function-stack.ts"
    "typescript/lambda-python-function-stack.ts"
    "typescript/lambda-java-function-stack.ts"
)

SCRIPT_PATH=${BASH_SOURCE[0]}
SCRIPTS_DIR=$(dirname $SCRIPT_PATH)
REPO_DIR=$(dirname $SCRIPTS_DIR)
ROOT_DIR=$(pwd)
if [[ "$ROOT_DIR" =~ .*"datadog-cdk-constructs/scripts".* ]]; then
    echo "Make sure to run this script from the root $(datadog-cdk-constructs) directory, aborting"
    exit 1
fi

INTEGRATION_TESTS_DIR="$REPO_DIR/integration_tests/"
if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
    echo "Overwriting snapshots in this execution"
fi

# Login to ECR. This is a required step in order to pull a public Docker image for the PythonFunction construct
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

cd $INTEGRATION_TESTS_DIR

OUTPUT_ARRAY=("====================================")
ALL_TESTS_PASSED=0
compose_output() {
    if [ $1 -eq 0 ]; then
        SUCCESS_MESSAGE="PASS: $2"
        OUTPUT_ARRAY+=("$SUCCESS_MESSAGE")
        echo $SUCCESS_MESSAGE
        ((ALL_TESTS_PASSED += 1))
    else
        ERR_MESSAGE="FAIL: $2. Review the diff output above."
        INFO_MESSAGE="If you expected the $2 to be different, generate new snapshots by running this command from a development branch on your local repository: 'UPDATE_SNAPSHOTS=true ./scripts/run_integration_tests.sh'"
        OUTPUT_ARRAY+=("$ERR_MESSAGE")
        echo $ERR_MESSAGE $INFO_MESSAGE
    fi
}

printOutputAndExit() {
    for ((i = 0; i < ${#OUTPUT_ARRAY[@]}; i++)); do
        echo ${OUTPUT_ARRAY[i]}
    done

    NEWLINE=$'\n'
    if [ $ALL_TESTS_PASSED -eq ${#STACK_CONFIG_PATHS[@]} ]; then
        echo "${NEWLINE}SUCCESS: ${ALL_TESTS_PASSED} out of ${#STACK_CONFIG_PATHS[@]} snapshot tests passed."
        exit 0
    else
        echo "${NEWLINE}FAIL: ${ALL_TESTS_PASSED} out of ${#STACK_CONFIG_PATHS[@]} snapshot tests passed."
        exit 1
    fi
}

for ((i = 0; i < ${#STACK_CONFIG_PATHS[@]}; i++)); do
    npx tsc --project tsconfig.json
    if [[ ${STACK_CONFIG_PATHS[i]} =~ ^typescript/ && ${STACK_CONFIG_PATHS[i]} =~ \.ts$ ]]; then
        # Strip the ".ts" suffix
        STACK_CONFIG_PATH_NO_EXT="${STACK_CONFIG_PATHS[i]%.ts}"
        # Strip the "typescript/" suffix
        STACK_CONFIG_NAME="${STACK_CONFIG_PATH_NO_EXT#typescript/}"
        
        cdk synth --app testlib/integration_tests/stacks/$STACK_CONFIG_PATH_NO_EXT.js --json --quiet
    else
        echo "Invalid stack config path: ${STACK_CONFIG_PATHS[i]}"
        exit 1
    fi

    RAW_CFN_TEMPLATE="cdk.out/$STACK_CONFIG_NAME.template.json"
    if [ ! -e "$RAW_CFN_TEMPLATE" ]; then
        touch "$RAW_CFN_TEMPLATE"
    fi
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
    # Normalize Metadata aws:asset:original-path
    perl -p -i -e 's/("aws:asset:original-path": )"(.+)"/$1\"XXXXXXXXXXXXX\"/g' ${RAW_CFN_TEMPLATE}
    # Normalize Datadog Layer Arn versions
    perl -p -i -e 's/(arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-(Python27|Python36|Python37|Python38|Python39|Node12-x|Node14-x|Extension):\d+)/arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-\2:XXX/g' ${RAW_CFN_TEMPLATE}
    # Normalize API Gateway timestamps
    perl -p -i -e 's/("ApiGatewayDeployment.*")/"ApiGatewayDeploymentxxxx"/g' ${RAW_CFN_TEMPLATE}

    # Normalize resttest resource names
    perl -p -i -e 's/("restLogGroup.*")/"restLogGroupXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestCloudWatchRole.*")/"resttestCloudWatchRoleXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestDeploymentStageprod.*")/"resttestDeploymentStageprodXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestDeployment(?!Stageprod).*")/"resttestDeploymentXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestAccount.*")/"resttestAccountXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}

    perl -p -i -e 's/("resttestproxyANY(?!Api).*")/"resttestproxyANYXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestproxyANYApiPermissionlambda(nodejs|python)?functionstackresttest.*")/"resttestproxyANYApiPermissionlambdafunctionstackresttestXXXXXXXXANYproxyXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestproxyANYApiPermissionTestlambda(nodejs|python)?functionstackresttest.*")/"resttestproxyANYApiPermissionTestlambdafunctionstackresttestXXXXXXXXANYproxyXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestproxy(?!ANY).*")/"resttestproxyXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}

    perl -p -i -e 's/(functionstackresttest.*")/functionstackresttestXXXXXXXXANYXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestANY(?!Api).*")/"resttestANYXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttest(?!.*(Deployment|Endpoint|Cloud|Account|XXXXXXXX)).*")/"resttestXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}
    perl -p -i -e 's/("resttestEndpoint.*")/"resttestEndpointXXXXXXXX"/g' ${RAW_CFN_TEMPLATE}

    TEST_SNAPSHOT="snapshots/test-$STACK_CONFIG_NAME-snapshot.json"
    CORRECT_SNAPSHOT="snapshots/correct-$STACK_CONFIG_NAME-snapshot.json"

    cp ${RAW_CFN_TEMPLATE} ${TEST_SNAPSHOT}
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        echo "Overriding ${CORRECT_SNAPSHOT}"
        cp ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
    fi

    echo "Performing diff of ${TEST_SNAPSHOT} against ${CORRECT_SNAPSHOT}"
    set +e # Don't exit right away if there is a diff in snapshots
    diff ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
    RETURN_CODE=$?
    set -e
    compose_output $RETURN_CODE $STACK_CONFIG_NAME
done

printOutputAndExit
