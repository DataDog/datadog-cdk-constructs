# Datadog CDK TypeScript Example

Use this example TypeScript stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Set the Datadog API key in your shell session: `export DD_API_KEY=<DATADOG_API_KEY>`.
1. Install dependencies: `yarn`.
1. Synthesize the CloudFormation template: `cdk synth`.
1. Review the proposed resource and permission changes: `cdk diff`.
1. Deploy the stack to AWS: `cdk deploy`.
1. Execute your Task Definitions and verify data in [Datadog](https://app.datadoghq.com/) (metrics, traces, logs, orchestrator explorer, etc.)

## Testing

1. Run `yarn build` to create the TypeScript package.
1. Set the version as an environment variable for convenience: `VERSION=2.x.x`
1. Copy the local module: `cp dist/js/datadog-cdk-constructs-v2@$VERSION.jsii.tgz examples/ecs/typescript-stack/datadog-cdk-constructs-v2-$VERSION.jsii.tgz`.
1. Navigate to the example stack: `cd examples/ecs/typescript-stack`.
1. Install your local module: `yarn add file:./datadog-cdk-constructs-v2-$VERSION.jsii.tgz`.
1. Install project dependencies: `yarn install`.
1. View your updated YAML task definition: `cdk synth`.
1. Deploy the updated resources: `cdk deploy`.
