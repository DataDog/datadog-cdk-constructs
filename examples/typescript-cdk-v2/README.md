# Datadog CDK Typescript Demo!

Use this Typescript v2 CDK Construct Demo application to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Run `yarn` to pull in the dependencies.
1. Run `yarn watch` in a seperate terminal window to ensure the Typscript files are compiled to Javascript.
1. Update the layer versions in `lib/typescript_v2-stack.ts` with the latest releases:
   - Datadog Lambda Extension: https://github.com/DataDog/datadog-lambda-extension/releases
   - Python Layer: https://github.com/DataDog/datadog-lambda-python/releases
   - Node Layer: https://github.com/DataDog/datadog-lambda-js/releases
1. Get a Datadog API key to be used to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `DD_API_KEY="key123456" cdk synth` to synthesize the CloudFormation template.
1. Run `DD_API_KEY="key123456" cdk diff` to see the resource and permission changes that are made.
1. Deploy the CDK stack:
   ```bash
   DD_API_KEY="key123456" cdk deploy TypescriptV2Stack
   ```
1. Invoke your lambda functions and look for them in Datadog Serverless Monitoring
