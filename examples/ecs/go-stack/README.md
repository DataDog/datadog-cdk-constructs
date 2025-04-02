# Datadog CDK Go Example

Use this example Go stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library for ECS Fargate.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Set the Datadog API key in your shell session: `export DD_API_KEY=<DATADOG_API_KEY>`.
1. Synthesize the CloudFormation template: `cdk synth`.
1. Review the proposed resource and permission changes: `cdk diff`.
1. Deploy the stack to AWS: `cdk deploy`.
1. Invoke your ECS Task Defintions and verify data in [Datadog](https://app.datadoghq.com/) (metrics, traces, logs, orchestrator explorer, etc).

## Testing

1. Run `yarn build` to create the Python package.
2. Copy your local module: `cp -r dist/go/ddcdkconstruct examples/ecs/go-stack`.
3. Navigate to the example stack: `cd examples/ecs/go-stack`.
4. In `go.mod` change the version of the dependency `ddcdkconstruct`:

    ```go
    require(
      ...
      github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2 v2.0.0-unpublished
    )
    ```

5. Run the following commands to replace the import with the local path of the module

    ```go
    go mod edit -replace=github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2@v2.0.0-unpublished=./ddcdkconstruct
    go get -d github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2@v2.0.0-unpublished
    ```

6. Install dependencies: `go get`.
7. Review the proposed resource and permission changes: `cdk diff`.
8. Deploy the stack to AWS: `cdk deploy`.
9. Invoke your ECS Task Defintions and verify data in [Datadog](https://app.datadoghq.com/).

## Resources

This demo project was created and modified from [Tutorial: Create your first AWS CDK app](https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html)
