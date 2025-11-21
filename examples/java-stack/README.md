# Datadog CDK Java Example

Use this example Java stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Run `mvn compile` to compile the Java code.
1. Update the layer versions in [App.java](src/main/java/com/datadoghq/example/App.java) with the latest releases:
   - Datadog Lambda Extension: https://github.com/DataDog/datadog-lambda-extension/releases
   - Java Layer: https://github.com/DataDog/datadog-lambda-java/releases
   - Node Layer: https://github.com/DataDog/datadog-lambda-js/releases
   - Python Layer: https://github.com/DataDog/datadog-lambda-python/releases
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Invoke your Lambda functions and look for them in [Datadog Serverless Monitoring](https://app.datadoghq.com/serverless/aws/lambda).
