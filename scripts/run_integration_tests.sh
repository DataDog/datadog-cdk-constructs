#!/bin/bash

# Usage - run commands from repo root:
# To check if new changes to the plugin cause changes to any snapshots:
#   ./scripts/run_integration_tests.sh
# To regenerate snapshots:
#   UPDATE_SNAPSHOTS=true ./scripts/run_integration_tests.sh

set -e

# To add new tests create a new ts file in the 'integration_tests/lambda' directory, append it as a js file to the LAMBDA_CONFIGS array
# as well as creating a name for the snapshots that will be compared in your test. Add those snapshot names to the TEST_SNAPSHOTS and CORRECT_SNAPSHOTS arrays.
# Note: Each yml config, test, and correct snapshot file should be at the same index in their own array. e.g. All the files for the forwarder test are at index 0.
#       In order for this script to work correctly these arrays should have the same amount of elements.
LAMBDA_CONFIGS=("lambda-stack.js")
TEST_SNAPSHOTS=("test_lambda_stack_snapshot.json")
CORRECT_SNAPSHOTS=("correct_lambda_stack_snapshot.json")

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

cd $integration_tests_dir
RAW_CFN_TEMPLATE="cdk.out/ExampleDatadogStack.template.json"
for ((i=0; i < ${#LAMBDA_CONFIGS[@]}; i++)); do
    tsc --project tsconfig.json
    cdk synth --app testlib/integration_tests/lambda/${LAMBDA_CONFIGS[i]} --json

    # Normalize LambdaVersion ID's
    perl -p -i -e 's/(LambdaVersion.*")/LambdaVersionXXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize SHA256 hashes
    perl -p -i -e 's/("CodeSha256":.*)/"CodeSha256": "XXXX"/g' ${RAW_CFN_TEMPLATE}
    # Normalize Datadog Layer Arn versions
    perl -p -i -e 's/(arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-(Python27|Python36|Python37|Python38|Python39|Node10-x|Node12-x|Node14-x|Extension):\d+)/arn:aws:lambda:sa-east-1:464622532012:layer:Datadog-\2:XXX/g' ${RAW_CFN_TEMPLATE}
    # Normalize API Gateway timestamps
    perl -p -i -e 's/("ApiGatewayDeployment.*")/"ApiGatewayDeploymentxxxx"/g' ${RAW_CFN_TEMPLATE}

    cp ${RAW_CFN_TEMPLATE} ${TEST_SNAPSHOTS[i]}
    echo "===================================="
    if [ "$UPDATE_SNAPSHOTS" = "true" ]; then
        echo "Overriding ${CORRECT_SNAPSHOTS[i]}"
        cp ${TEST_SNAPSHOTS[i]} ${CORRECT_SNAPSHOTS[i]}
    fi

    echo "Performing diff of ${TEST_SNAPSHOTS[i]} against ${CORRECT_SNAPSHOTS[i]}"
    set +e # Dont exit right away if there is a diff in snapshots
    diff ${TEST_SNAPSHOTS[i]} ${CORRECT_SNAPSHOTS[i]}
    return_code=$?
    set -e
    if [ $return_code -eq 0 ]; then
        echo "SUCCESS: There were no differences between the ${TEST_SNAPSHOTS[i]} and ${CORRECT_SNAPSHOTS[i]}"
    else
        echo "FAILURE: There were differences between the ${TEST_SNAPSHOTS[i]} and ${CORRECT_SNAPSHOTS[i]}. Review the diff output above."
        echo "If you expected the ${TEST_SNAPSHOTS[i]} to be different generate new snapshots by running this command from a development branch on your local repository: 'UPDATE_SNAPSHOTS=true ./scripts/run_integration_tests.sh'"
        exit 1
    fi
    echo "===================================="
done
exit 0
