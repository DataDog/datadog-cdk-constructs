import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSFargateTaskDefinition", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let scope: Construct;
  let id: string;
  let props: ecs.FargateTaskDefinitionProps;
  let datadogProps: ecsDatadog.DatadogECSFargateProps;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");

    scope = stack; // Use the stack as the construct scope
    id = "TestTaskDefinition";
    props = {
      family: "test-family",
      cpu: 256,
      memoryLimitMiB: 512,
    };
    datadogProps = {
      registry: "public.ecr.aws/datadog/agent",
      imageVersion: "latest",
      apiKey: "test-api-key",
      logCollection: {
        isEnabled: true,
      },
      cws: {
        isEnabled: true,
      },
      apm: {
        isEnabled: true,
      },
    };
  });

  it("creates the agent container", () => {
    new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the agent container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          Image: "public.ecr.aws/datadog/agent:latest",
        }),
      ]),
    });
  });

  it("creates volumes for DogStatsD/APM UDS if necessary", () => {
    new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the volume for DogStatsD/APM UDS is added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      Volumes: Match.arrayWith([
        Match.objectLike({
          Name: "dd-sockets",
        }),
      ]),
    });
  });

  it("creates the CWS container when enabled", () => {
    new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the CWS container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "cws-instrumentation-init",
          Image: "datadog/cws-instrumentation:latest",
        }),
      ]),
    });
  });

  it("creates the log container when log collection is enabled", () => {
    new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the log container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-log-router",
          Image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
        }),
      ]),
    });
  });

  it("adds the correct IAM policies to the task role for ecs fargate agent check", () => {
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the task role has the expected IAM policy
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["ecs:ListClusters", "ecs:ListContainerInstances", "ecs:DescribeContainerInstances"],
            Effect: "Allow",
            Resource: "*",
          }),
        ]),
      },
      // Ensure that the policy is attached to the task role
      Roles: Match.arrayWith([
        {
          Ref: stack.getLogicalId(taskDefinition.taskRole.node.defaultChild as cdk.CfnElement),
        },
      ]),
    });
  });
});
