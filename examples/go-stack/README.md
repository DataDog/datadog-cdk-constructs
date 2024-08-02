# Datadog CDK Go Example

Use this example Go stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library. It contains Node, Python and Go Lambda functions.

## Getting Started

1. Get a Datadog API key to be used to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Invoke your Lambda functions and look for them in [Datadog Serverless Monitoring](https://app.datadoghq.com/functions?cloud=aws).

![Image 2023-11-02 at 11 44 22 AM](https://github.com/DataDog/datadog-cdk-constructs/assets/35278470/9c7b7b15-27ff-4de1-8f54-f5c352f1774b)

## Resources

This demo project was created and modified from [Tutorial: Create your first AWS CDK app](https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html)
