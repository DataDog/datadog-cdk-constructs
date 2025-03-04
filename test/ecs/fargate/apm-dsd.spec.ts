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
      dogstatsd: {
        isEnabled: true,
        isSocketEnabled: true,
      },
      apm: {
        isEnabled: true,
        isSocketEnabled: true,
      },
    };
  });

  it("should add volume mounts and environment variables for DogStatsD and APM", () => {
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
    };
    taskDefinition.addContainer("app-container", containerProps);
    const template = Template.fromStack(stack);

    // Validate that the volume mounts and environment variables are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "app-container",
          MountPoints: Match.arrayWith([
            Match.objectLike({
              ContainerPath: "/var/run/datadog",
              SourceVolume: "dd-sockets",
              ReadOnly: false,
            }),
          ]),
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_DOGSTATSD_URL",
              Value: "unix:///var/run/datadog/dsd.socket",
            }),
            Match.objectLike({
              Name: "DD_TRACE_AGENT_URL",
              Value: "unix:///var/run/datadog/apm.socket",
            }),
          ]),
        }),
      ]),
    });
  });

  it("should add environment variables for DogStatsD and APM when sockets are not enabled", () => {
    datadogProps = {
      ...datadogProps,
      dogstatsd: {
        isEnabled: true,
        isSocketEnabled: false,
      },
      apm: {
        isEnabled: true,
        isSocketEnabled: false,
      },
    };
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
    };
    taskDefinition.addContainer("app-container", containerProps);
    const template = Template.fromStack(stack);

    // Validate that the environment variables are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "app-container",
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_AGENT_HOST",
              Value: "127.0.0.1",
            }),
          ]),
        }),
      ]),
    });
  });
});
