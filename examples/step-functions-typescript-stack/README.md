# Datadog CDK TypeScript Example

This example is used to test the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library for Step Functions. The Step Functions support is still in development. Once it's ready, this example will be merged into the `typescript-stack` so that a single stack can be used for testing both Lambda functions and Step Functions, making it easier for CDK construct developers to test their changes. The two examples are kept separate for now so the incomplete Step Function support won't break the testing of Lambda functions.
