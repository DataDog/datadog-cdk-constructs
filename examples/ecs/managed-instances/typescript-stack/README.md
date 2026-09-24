# Datadog CDK TypeScript Example - ECS Managed Instances

Use this example TypeScript stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library's `DatadogECSManagedInstances` construct, which deploys the Datadog Agent as an ECS Managed Daemon on ECS Managed Instances.

This stack provisions the surrounding ECS Managed Instances infrastructure (cluster, capacity provider, infrastructure role, EC2 instance profile role) with plain AWS CDK resources, then uses `DatadogECSManagedInstances` to create the Datadog Agent daemon task definition and daemon. A sample application task definition is wired to the daemon over a Unix domain socket.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Set the Datadog API key in your shell session: `export DD_API_KEY=<DATADOG_API_KEY>`.
1. Install dependencies: `yarn`.
1. Synthesize the CloudFormation template: `cdk synth`.
1. Review the proposed resource and permission changes: `cdk diff`.
1. Deploy the stack to AWS: `cdk deploy`.
1. Verify data in [Datadog](https://app.datadoghq.com/) (metrics, traces, etc.)

## Notes

- The EC2 instance profile role name starts with `ecsInstanceRole`. The AWS managed policy `AmazonECSInstanceRolePolicyForManagedInstances` scopes `iam:PassRole` to role names matching `ecsInstanceRole*`, so a CDK-auto-generated role name breaks instance launch.
- The application task definition uses `networkMode: HOST`. ECS Managed Instances only supports `host` or `awsvpc` network mode, not `bridge`.
- The Datadog Agent daemon task definition holds only the Agent container. Application containers always run in their own, separate task definition.

## Testing

1. Run `yarn build` to create the TypeScript package.
1. Set the version as an environment variable for convenience: `VERSION=2.x.x`
1. Copy the local module: `cp dist/js/datadog-cdk-constructs-v2@$VERSION.jsii.tgz examples/ecs/managed-instances/typescript-stack/datadog-cdk-constructs-v2-$VERSION.jsii.tgz`.
1. Navigate to the example stack: `cd examples/ecs/managed-instances/typescript-stack`.
1. Install your local module: `yarn add file:./datadog-cdk-constructs-v2-$VERSION.jsii.tgz`.
1. Install project dependencies: `yarn install`.
1. View your updated YAML task definition: `cdk synth`.
1. Deploy the updated resources: `cdk deploy`.
