#!/bin/bash

# Usage - run commands from repo root:
# To check if new changes to the library cause changes to any snapshots:
#   aws-vault exec sso-serverless-sandbox-account-admin -- ./scripts/run_integration_tests.sh
# To regenerate snapshots:
#   UPDATE_SNAPSHOTS=true aws-vault exec sso-serverless-sandbox-account-admin -- ./scripts/run_integration_tests.sh

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
    "typescript/step-function-stack.ts"
    "python/lambda_python_stack.py"
    "python/step_functions_python_stack.py"
    "go/lambda_go_stack.go"
    "go/step_functions_go_stack.go"
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

# Remove snapshots generated from previous test runs
rm -rf cdk.out stacks/go/cdk.out
rm -f snapshots/test-*-snapshot.json

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

snake_case_to_pascal_case() {
  local snake_case="$1"
  echo "$snake_case" | perl -pe 's/(?:^|_)./uc($&)/ge;s/_//g'
}

echo "Setting up for TypeScript stacks"
npx tsc --project tsconfig.json

echo "Setting up for Python"
VERSION=$(jq -r '.version' ../version.json)
cp "$ROOT_DIR/dist/python/datadog_cdk_constructs_v2-$VERSION.tar.gz" stacks/python
cd stacks/python
virtualenv env && source env/bin/activate
pip install -r requirements.txt
pip install datadog_cdk_constructs_v2-$VERSION.tar.gz
cd ../..

echo "Setting up for Go"
cp -r ../dist/go/ddcdkconstruct stacks/go
cd stacks/go
go get
cd ../..

for ((i = 0; i < ${#STACK_CONFIG_PATHS[@]}; i++)); do
    if [[ ${STACK_CONFIG_PATHS[i]} =~ ^typescript/ && ${STACK_CONFIG_PATHS[i]} =~ \.ts$ ]]; then
        # Case 1. TypeScript
        # Strip the ".ts" suffix
        STACK_CONFIG_PATH_NO_EXT="${STACK_CONFIG_PATHS[i]%.ts}"
        # Strip the "typescript/" prefix
        STACK_CONFIG_NAME="${STACK_CONFIG_PATH_NO_EXT#typescript/}"
        
        cdk synth --app testlib/integration_tests/stacks/$STACK_CONFIG_PATH_NO_EXT.js --json --quiet
        RAW_CFN_TEMPLATE="cdk.out/$STACK_CONFIG_NAME.template.json"
    elif [[ ${STACK_CONFIG_PATHS[i]} =~ ^python/ && ${STACK_CONFIG_PATHS[i]} =~ \.py$ ]]; then
        # Case 2. Python
        # Strip the ".py" suffix
        STACK_CONFIG_PATH_NO_EXT="${STACK_CONFIG_PATHS[i]%.py}"
        # Strip the "python/" prefix
        STACK_CONFIG_NAME="${STACK_CONFIG_PATH_NO_EXT#python/}"

        cdk synth --app "python3 stacks/${STACK_CONFIG_PATHS[i]}" --json --quiet

        # convert snake_case to PascalCase (e.g. lambda_python_stack to LambdaPythonStack) to match the 
        # name of the generated json file for the Python stack
        STACK_CONFIG_NAME_PASCAL_CASE=$(snake_case_to_pascal_case "$STACK_CONFIG_NAME")
        RAW_CFN_TEMPLATE="cdk.out/$STACK_CONFIG_NAME_PASCAL_CASE.template.json"
    elif [[ ${STACK_CONFIG_PATHS[i]} =~ ^go/ && ${STACK_CONFIG_PATHS[i]} =~ \.go$ ]]; then
        # Case 3. Go
        # Strip the ".go" suffix
        STACK_CONFIG_PATH_NO_EXT="${STACK_CONFIG_PATHS[i]%.go}"
        # Strip the "go/" prefix
        STACK_CONFIG_NAME="${STACK_CONFIG_PATH_NO_EXT#go/}"

        # convert snake_case to PascalCase (e.g. lambda_go_stack to LambdaGoStack) to match the 
        # name of the Go stack
        STACK_CONFIG_NAME_PASCAL_CASE=$(snake_case_to_pascal_case "$STACK_CONFIG_NAME")

        cd stacks/go
        cdk synth $STACK_CONFIG_NAME_PASCAL_CASE --app "go run *.go" --json --quiet
        cd ../..
        RAW_CFN_TEMPLATE="stacks/go/cdk.out/$STACK_CONFIG_NAME_PASCAL_CASE.template.json"
    else
        echo "Invalid stack config path: ${STACK_CONFIG_PATHS[i]}"
        exit 1
    fi

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
    perl -p -i -e 's/(arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-(Python27|Python36|Python37|Python38|Python39|Node18-x|Extension):\d+)/arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-\2:XXX/g' ${RAW_CFN_TEMPLATE}
    # Normalize API Gateway timestamps
    perl -p -i -e 's/("ApiGatewayDeployment.*")/"ApiGatewayDeploymentxxxx"/g' ${RAW_CFN_TEMPLATE}
    # Normalize Subscription Filter name
    perl -p -i -e 's/DatadogSubscriptionFilter[0-9a-fA-F]+/DatadogSubscriptionFilterXXXXXXXX/g' ${RAW_CFN_TEMPLATE}

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

    # Normalize dd.commit.sha in DD_TAG
    perl -p -i -e 's/(git.commit.sha:[a-f0-9]+)/git.commit.sha:XXXXXXXX/g' ${RAW_CFN_TEMPLATE}

    # Normalize Git remote URL
    perl -p -i -e 's/(github.com\/DataDog\/datadog-cdk-constructs.git)/github.com\/DataDog\/datadog-cdk-constructs/g' ${RAW_CFN_TEMPLATE}

    TEST_SNAPSHOT="snapshots/test-$STACK_CONFIG_NAME-snapshot.json"
    CORRECT_SNAPSHOT="snapshots/correct-$STACK_CONFIG_NAME-snapshot.json"

    cp ${RAW_CFN_TEMPLATE} ${TEST_SNAPSHOT}
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        echo "Overriding ${CORRECT_SNAPSHOT}"
        cp ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
    fi

    if [ ! -s "$TEST_SNAPSHOT" ]; then
        echo "The snapshot is empty. Please ensure the Python/Go stack name (e.g. LambdaPythonStack) is the PascalCase of the file name (e.g. lambda_python_stack.py)."
        RETURN_CODE=1
    else
        echo "Performing diff of ${TEST_SNAPSHOT} against ${CORRECT_SNAPSHOT}"
        set +e # Don't exit right away if there is a diff in snapshots
        diff ${TEST_SNAPSHOT} ${CORRECT_SNAPSHOT}
        RETURN_CODE=$?
        set -e
    fi
    compose_output $RETURN_CODE $STACK_CONFIG_NAME

done

printOutputAndExit
