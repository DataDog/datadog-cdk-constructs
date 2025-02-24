import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSFargateLogging", () => {
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
        logDriverConfiguration: {
          registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
          imageVersion: "stable",
          hostEndpoint: "http-intake.logs.datadoghq.com-test",
        },
      },
    };
  });

  it("creates the log container when log collection is enabled", () => {
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // assert that the logContainer is defined
    expect(task.logContainer).toBeDefined();

    // Validate that the log container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
          FirelensConfiguration: {
            Type: "fluentbit",
            Options: {
              "enable-ecs-log-metadata": "true",
            },
          },
        }),
      ]),
    });
  });

  it("does not create the log container when log collection is disabled", () => {
    // Disable log collection
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: false,
      },
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // assert the log container is not defined
    expect(task.logContainer).toBeUndefined();

    // Validate that the log container is not created
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: [
        {
          Name: "datadog-agent",
        },
      ],
    });
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.not(
        Match.arrayWith([
          Match.objectLike({
            Name: "datadog-log-router",
          }),
        ]),
      ),
    });
  });

  it("sets the correct log driver configuration on other containers", () => {
    datadogProps = {
      ...datadogProps,
      environmentVariables: {
        DD_TAGS: "team:cont-p",
      },
      logCollection: {
        isEnabled: true,
        logDriverConfiguration: {
          tls: "on",
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the log driver configuration is set correctly
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: task.datadogContainer.imageName,
          LogConfiguration: {
            LogDriver: "awsfirelens",
            Options: Match.objectLike({
              Name: "datadog",
              Host: "http-intake.logs.datadoghq.com",
              TLS: "on",
              provider: "ecs",
              dd_tags: "team:cont-p",
            }),
          },
        }),
      ]),
    });

    // Log driver is not applied to the log router itself
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
          LogConfiguration: Match.absent(),
        }),
      ]),
    });
  });
});
