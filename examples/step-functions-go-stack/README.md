# Datadog CDK Go Example

Use this example Go stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library for Step Functions.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Set up Datadog forwarder ([Datadog Forwarder documentation](https://docs.datadoghq.com/logs/guide/forwarder/?tab=cloudformation#installation)).
1. Run `export DD_FORWARDER_ARN=<DD_FORWARDER_ARN>` to set the Datadog forwarder ARN in your shell session.
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Invoke your Lambda functions and look for them in [Datadog Serverless Monitoring](https://app.datadoghq.com/serverless/aws/step-functions).

![Datadog CDK Go Stack](https://github.com/user-attachments/assets/ba9ceae7-df3a-4d4b-8c51-6a29d82d25b1)

## Resources

This demo project was created and modified from [Tutorial: Create your first AWS CDK app](https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html)
