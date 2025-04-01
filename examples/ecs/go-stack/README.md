# Datadog CDK Go Example

Use this example Go stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Invoke your ECS Task Defintions and look for them in [Datadog](https://app.datadoghq.com/) (metrics, traces, logs, orchestrator explorer, etc).

## Testing

1. Run `yarn build` to create the Python package.
2. Run `cp -r dist/go/ddcdkconstruct examples/ecs/go-stack` to copy your local module.
3. Run `cd examples/ecs/go-stack` to navigate to the stack.
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

6. Run `go get` to install dependencies.
7. Run `cdk diff` to see the resource and permission changes that are made.
8. Run `cdk deploy` to deploy the stack to AWS.
9. Invoke your ECS Task Defintions and look for them in [Datadog](https://app.datadoghq.com/).

## Resources

This demo project was created and modified from [Tutorial: Create your first AWS CDK app](https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html)
