# Datadog CDK Go Example - ECS Managed Instances

Use this example Go stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v3 library's `DatadogECSManagedInstances` construct, which deploys the Datadog Agent as an ECS Managed Daemon on ECS Managed Instances.

This stack provisions the surrounding ECS Managed Instances infrastructure (cluster, capacity provider, infrastructure role, EC2 instance profile role) with plain AWS CDK resources, then uses `DatadogECSManagedInstances` to create the Datadog Agent daemon task definition and daemon. A sample application task definition is wired to the daemon over a Unix domain socket.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Set the Datadog API key in your shell session: `export DD_API_KEY=<DATADOG_API_KEY>`.
1. Synthesize the CloudFormation template: `cdk synth`.
1. Review the proposed resource and permission changes: `cdk diff`.
1. Deploy the stack to AWS: `cdk deploy`.
1. Verify data in [Datadog](https://app.datadoghq.com/) (metrics, traces, etc).

## Notes

- The EC2 instance profile role name starts with `ecsInstanceRole`. The AWS managed policy `AmazonECSInstanceRolePolicyForManagedInstances` scopes `iam:PassRole` to role names matching `ecsInstanceRole*`, so a CDK-auto-generated role name breaks instance launch.
- The application task definition uses `NetworkMode_HOST`. ECS Managed Instances only supports `host` or `awsvpc` network mode, not `bridge`.
- The Datadog Agent daemon task definition holds only the Agent container. Application containers always run in their own, separate task definition.

## Testing

1. Run `yarn build` to create the Go package.
2. Copy your local module: `cp -r dist/go/ddcdkconstruct examples/ecs/managed-instances/go-stack`.
3. Navigate to the example stack: `cd examples/ecs/managed-instances/go-stack`.
4. In `go.mod` change the version of the dependency `ddcdkconstruct`:

    ```go
    require(
      ...
      github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3 v3.0.0-unpublished
    )
    ```

5. Run the following commands to replace the import with the local path of the module

    ```go
    go mod edit -replace=github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3@v3.0.0-unpublished=./ddcdkconstruct
    go get -d github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3@v3.0.0-unpublished
    ```

6. Install dependencies: `go get`.
7. Review the proposed resource and permission changes: `cdk diff`.
8. Deploy the stack to AWS: `cdk deploy`.
9. Verify data in [Datadog](https://app.datadoghq.com/).

## Resources

This demo project was created and modified from [Tutorial: Create your first AWS CDK app](https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html)
