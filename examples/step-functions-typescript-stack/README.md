# Datadog CDK TypeScript Example

Use this example TypeScript stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library for Step Functions.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Set up Datadog forwarder ([Datadog Forwarder documentation](https://docs.datadoghq.com/logs/guide/forwarder/?tab=cloudformation#installation)).
1. Run `export DD_FORWARDER_ARN=<DD_FORWARDER_ARN>` to set the Datadog forwarder ARN in your shell session.
1. Run `yarn` install dependencies.
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy --all` to deploy the stacks to AWS.
1. Invoke your Step Function and look for them in [Datadog Serverless Monitoring](https://app.datadoghq.com/functions?cloud=aws&entity_view=step_functions).

![Datadog CDK TypeScript Stack](https://github.com/user-attachments/assets/202ed91a-f034-42e9-83c8-12e82fa101e2)
