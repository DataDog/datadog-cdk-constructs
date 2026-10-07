# E2E tests

## ECS Fargate

The suite runs the `DatadogECSFargate` construct against a temporary ECS Fargate service:

1. Deploy the workload with plain Fargate task definitions: a Node.js service, and one task definition for each tracer language.
2. Deploy it again with `DatadogECSFargateTaskDefinition` in their place, and verify each new revision: the Datadog Agent and log router sidecars, the API key reference, and the injected tracer.
3. Send requests to the service and wait for its spans and logs in Datadog.
4. Confirm `cdk diff --fail` reports no changes.
5. Destroy the stack and verify that the service and task definitions are gone.

The language task definitions are registered but never run, so only the Node.js service proves that an injected tracer loads and sends traces.

### Resources

The suite deploys into resources that are provisioned outside this repository. Set these variables:

| Variable                     | Description                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AWS_ECS_CLUSTER`            | The ECS cluster that runs the service.                                                                                                                                                          |
| `AWS_ECS_SUBNETS`            | Comma-separated public subnets of one VPC.                                                                                                                                                      |
| `AWS_ECS_SECURITY_GROUP`     | A security group that allows inbound traffic on port 8080.                                                                                                                                      |
| `AWS_ECS_APP_IMAGE_REGISTRY` | The registry that hosts the `node-ssi`, `dotnet-ssi`, `java-ssi`, `php-ssi`, `python-ssi`, and `ruby-ssi` fixture images.                                                                       |
| `AWS_ECS_API_KEY_SECRET_ARN` | The complete ARN of a Secrets Manager secret that holds a Datadog API key, optionally followed by `:<json-field>::`. The key must belong to the organization whose telemetry the suite queries. |
| `AWS_ECS_LOG_GROUP`          | The CloudWatch log group for the uninstrumented service.                                                                                                                                        |

The account must be CDK-bootstrapped in the region of these resources. The suite defaults to `eu-central-1` and `datadoghq.com`. Set `AWS_REGION` or `DD_SITE` to override them.

### Run locally

You need Node 22+, Yarn, AWS credentials for the account, and Datadog API and application keys for the serverless org. You can set the variables above in a gitignored `e2e/.env.local` file.

```bash
aws-vault exec sso-serverless-sandbox-account-admin -- \
  dd-auth --domain ddserverless.datadoghq.com -- bash -c '
    export DATADOG_API_KEY="$DD_API_KEY" DATADOG_APP_KEY="$DD_APP_KEY"
    yarn test:e2e ecs-fargate
  '
```

### CI

[The E2E workflow](../.github/workflows/e2e.yml) runs the suite when the ECS construct or the suite changes, once the `AWS_ECS_*_E2E` repository variables are set. It assumes the `AWS_ROLE_ARN_E2E` role through GitHub OIDC and reads the Datadog API and application keys from the `DATADOG_API_KEY_E2E` and `DATADOG_APP_KEY_E2E` secrets.

Besides deploying through the CDK bootstrap roles, the role needs these read permissions: `ecs:DescribeTaskDefinition`, `ecs:ListTaskDefinitions`, `ecs:DescribeServices`, `ecs:ListTasks`, `ecs:DescribeTasks`, `ec2:DescribeSubnets`, and `ec2:DescribeNetworkInterfaces`. Grant them in `serverless-ci/e2e/terraform/aws/policies/datadog-cdk-e2e-deploy.json`.

### Resource cleanup

Each run names its stack, service, and task definition families after `one-e2e-cdk-ecs-<runid>`, and tags them with its run ID and creation time. The suite always attempts `cdk destroy` at the end.

```bash
aws cloudformation delete-stack --stack-name one-e2e-cdk-ecs-<runid> --region eu-central-1
```
