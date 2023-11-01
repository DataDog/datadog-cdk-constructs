# Datadog CDK TypeScript Example

Use this example TypeScript stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library. It contains Node, Python and Go Lambda functions.

## Getting Started

1. Get a Datadog API key to be used to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=DATADOG_API_KEY_HERE` to set the Datadog API key in your shell session.
1. Run `yarn` install dependencies.
1. Update the layer versions in `lib/cdk-typescript-stack.ts` with the latest releases:
   - Datadog Lambda Extension: https://github.com/DataDog/datadog-lambda-extension/releases
   - Python Layer: https://github.com/DataDog/datadog-lambda-python/releases
   - Node Layer: https://github.com/DataDog/datadog-lambda-js/releases
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS
1. Invoke your Lambda functions and look for them in Datadog Serverless Monitoring
