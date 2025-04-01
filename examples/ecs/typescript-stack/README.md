# Datadog CDK TypeScript Example

Use this example TypeScript stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Run `yarn` install dependencies.
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Execute your Task Definitions and look for them in [Datadog](https://app.datadoghq.com/) (metrics, traces, logs, orchestrator explorer, etc.)

## Testing

1. Run `yarn build` to create the Typescript package.
1. Run `VERSION=2.x.x` to store variable for convenience.
1. Run `cp dist/js/datadog-cdk-constructs-v2@$VERSION.jsii.tgz examples/ecs/typescript-stack/datadog-cdk-constructs-v2-$VERSION.jsii.tgz` to copy your local module.
1. Run `cd examples/ecs/typescript-stack` to navigate to the stack.
1. Run `yarn add file:./datadog-cdk-constructs-v2-$VERSION.jsii.tgz` to install your local module.
1. Run `yarn install` to install dependencies.
1. Run `cdk synth` to view your updated yaml task definition.
1. Run `cdk deploy` to deploy your updated resources.
